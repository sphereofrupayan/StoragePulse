/* ============================================================
   STORAGEPULSE — server.js
   Express backend that performs REAL file system scans:
   walks a directory tree, sizes it, buckets files by type,
   and reports actual disk capacity/free space for that volume.
   ============================================================ */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const checkDiskSpace = require('check-disk-space').default;

require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/* ---------------- file type categorisation ---------------- */
const CATEGORY_MAP = {
  media: ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.wmv', '.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.rtf', '.odt', '.pages'],
  code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.html', '.css', '.scss', '.json',
         '.go', '.rs', '.rb', '.php', '.sh', '.yml', '.yaml', '.sql', '.vue', '.swift', '.kt'],
  applications: ['.exe', '.app', '.dmg', '.deb', '.rpm', '.apk', '.bin', '.msi', '.pkg', '.appimage'],
  system: ['.log', '.tmp', '.cache', '.lock', '.bak', '.swp', '.ds_store', '.sys', '.dll'],
};

function categorize(ext) {
  const e = ext.toLowerCase();
  for (const [category, list] of Object.entries(CATEGORY_MAP)) {
    if (list.includes(e)) return category;
  }
  return 'other';
}

/* ---------------- recursive directory walker ---------------- */
// Safety limits so a scan of a huge tree (or a symlink loop) can't hang the server.
const MAX_NODES = 150000;
const MAX_DEPTH = 16;

async function walk(dirPath, depth, stats) {
  let size = 0;

  if (depth > MAX_DEPTH || stats.nodeCount + stats.folderCount >= MAX_NODES) {
    stats.truncated = true;
    return size;
  }

  let entries;

  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    stats.errors++;
    console.error(`Cannot read directory: ${dirPath}`);
    console.error(`Error: ${err.code} - ${err.message}`);
    return size;
  }

  for (const entry of entries) {
    if (stats.nodeCount + stats.folderCount >= MAX_NODES) {
      stats.truncated = true;
      break;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    try {
      if (entry.isDirectory()) {
        stats.folderCount++;

        const childSize = await walk(fullPath, depth + 1, stats);
        size += childSize;

      } else if (entry.isFile()) {
        const st = await fs.promises.stat(fullPath);

        size += st.size;
        stats.nodeCount++;
        stats.totalSize += st.size;

        const ext = path.extname(entry.name) || '(none)';
        const category = categorize(ext);

        stats.fileTypeSizes[category] =
          (stats.fileTypeSizes[category] || 0) + st.size;

        stats.fileTypeCounts[category] =
          (stats.fileTypeCounts[category] || 0) + 1;
      }

    } catch (err) {
      stats.errors++;
      console.error(`Cannot process: ${fullPath}`);
      console.error(`Error: ${err.code} - ${err.message}`);
    }
  }

  return size;
}

async function scanDirectory(rootPath) {
  const rootStat = await fs.promises.stat(rootPath);

  if (!rootStat.isDirectory()) {
    throw new Error('NOT_A_DIRECTORY');
  }

  const stats = {
    nodeCount: 0,
    folderCount: 0,
    totalSize: 0,
    fileTypeSizes: {},
    fileTypeCounts: {},
    truncated: false,
    errors: 0,
    topLevel: [],
  };

  let topEntries;

  try {
    topEntries = await fs.promises.readdir(rootPath, { withFileTypes: true });
  } catch (err) {
    console.error(`Cannot read root directory: ${rootPath}`);
    console.error(`Error: ${err.code} - ${err.message}`);
    throw err;
  }

  for (const entry of topEntries) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const fullPath = path.join(rootPath, entry.name);

    try {
      let size = 0;

      if (entry.isDirectory()) {
        stats.folderCount++;

        size = await walk(fullPath, 1, stats);

      } else if (entry.isFile()) {
        const st = await fs.promises.stat(fullPath);

        size = st.size;
        stats.nodeCount++;
        stats.totalSize += st.size;

        const ext = path.extname(entry.name) || '(none)';
        const category = categorize(ext);

        stats.fileTypeSizes[category] =
          (stats.fileTypeSizes[category] || 0) + st.size;

        stats.fileTypeCounts[category] =
          (stats.fileTypeCounts[category] || 0) + 1;
      }

      const entryStat = await fs.promises.stat(fullPath);

      stats.topLevel.push({
        name: entry.name,
        isDir: entry.isDirectory(),
        size,
        modified: entryStat.mtime.toISOString(),
      });

    } catch (err) {
      stats.errors++;
      console.error(`Cannot process top-level entry: ${fullPath}`);
      console.error(`Error: ${err.code} - ${err.message}`);
    }
  }

  stats.topLevel.sort((a, b) => b.size - a.size);

  return stats;
}

/* ---------------- routes ---------------- */

app.get('/api/scan', async (req, res) => {
  const requested = (req.query.path || '').trim();
  const targetPath = path.resolve(requested || process.cwd());

  try {
    const stats = await scanDirectory(targetPath);

    let disk = null;
    try {
      const diskInfo = await checkDiskSpace(targetPath);
      disk = {
        total: diskInfo.size,
        free: diskInfo.free,
        used: diskInfo.size - diskInfo.free,
        mount: diskInfo.diskPath,
      };
    } catch (e) {
      disk = null; // still return the scan even if disk-space lookup isn't supported on this OS
    }

res.json({
  ok: true,
  root: targetPath,
  scannedAt: new Date().toISOString(),
  nodeCount: stats.nodeCount,
  folderCount: stats.folderCount,
  totalSize: stats.totalSize,
  truncated: stats.truncated,
  errors: stats.errors,
  topLevel: stats.topLevel,
  fileTypeSizes: stats.fileTypeSizes,
  fileTypeCounts: stats.fileTypeCounts,
  disk,
});
  } catch (err) {
    let code = 'SCAN_FAILED';
    if (err.code === 'ENOENT') code = 'PATH_NOT_FOUND';
    else if (err.code === 'EACCES') code = 'PERMISSION_DENIED';
    else if (err.message === 'NOT_A_DIRECTORY') code = 'NOT_A_DIRECTORY';
    res.status(400).json({ ok: false, error: code, path: targetPath });
  }
});

app.get('/api/home', (req, res) => {
  res.json({ home: os.homedir(), cwd: process.cwd(), platform: os.platform() });
});
app.post('/api/ai', async (req, res) => {
  try {
    const { question, scanData } = req.body;

    if (!question) {
      return res.status(400).json({
        ok: false,
        error: 'QUESTION_REQUIRED'
      });
    }

    if (!scanData) {
      return res.status(400).json({
        ok: false,
        error: 'NO_SCAN_DATA'
      });
    }

    const prompt = `
You are StoragePulse AI, a storage analysis assistant.

Answer the user's question using ONLY the storage scan data provided below.

Be concise, clear and helpful.

Storage scan data:
${JSON.stringify(scanData, null, 2)}

User question:
${question}
`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'You are the StoragePulse storage analysis assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const answer = completion.choices[0].message.content;

    res.json({
      ok: true,
      answer
    });

  } catch (error) {
    console.error('AI ERROR:', error);

    res.status(500).json({
      ok: false,
      error: 'AI_REQUEST_FAILED'
    });
  }
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`StoragePulse backend running → http://localhost:${PORT}`);
  console.log(`Default scan root (when no path is given): ${process.cwd()}`);
});