/* ============================================================
   STORAGEPULSE — script.js
   Preloader bubble field, page transition, and dashboard logic
   ============================================================ */

/* ============ WHITE BUBBLE / DOT FIELD (canvas) ============
   Plain floating white dots that gently drift and pulse in size —
   no connecting lines, no constellations.                       */
let latestScanData = null;
function initBubbleField(canvasId, opts){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return null;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let bubbles = [];
  let rafId = null;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.parentElement.offsetWidth;
    h = canvas.parentElement.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initBubbles();
  }

  // Star tints: mostly plain starlight, with a scattering of ion-cyan
  // and nebula-violet stars for a little color variety in the field.
  const STAR_TINTS = ['255,255,255', '255,255,255', '255,255,255', '170,230,255', '190,175,255'];

  function initBubbles(){
    bubbles = [];
    for(let i = 0; i < opts.count; i++){
      bubbles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * (opts.maxR - opts.minR) + opts.minR,
        vx: (Math.random() - 0.5) * opts.speed,
        vy: opts.rise ? -(Math.random() * opts.speed + opts.speed * 0.3) : (Math.random() - 0.5) * opts.speed,
        baseAlpha: Math.random() * (opts.maxAlpha - opts.minAlpha) + opts.minAlpha,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.006 + Math.random() * 0.01,
        tint: STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)]
      });
    }
  }

  // A single rare comet streak — one orchestrated moment rather than
  // constant motion, so it stays a delight instead of a distraction.
  let comet = null;
  function maybeSpawnComet(){
    if(!opts.comet) return;
    if(!comet && Math.random() < 0.0025){
      const fromLeft = Math.random() < 0.5;
      comet = {
        x: fromLeft ? -20 : w + 20,
        y: Math.random() * h * 0.5,
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 2),
        vy: 2 + Math.random() * 1.5,
        life: 0,
        maxLife: 60
      };
    }
  }

  function step(){
    ctx.clearRect(0, 0, w, h);
    bubbles.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.phase += b.pulseSpeed;

      if(opts.rise){
        if(b.y < -10){ b.y = h + 10; b.x = Math.random() * w; }
        if(b.x < -10) b.x = w + 10;
        if(b.x > w + 10) b.x = -10;
      } else {
        if(b.x < -10) b.x = w + 10;
        if(b.x > w + 10) b.x = -10;
        if(b.y < -10) b.y = h + 10;
        if(b.y > h + 10) b.y = -10;
      }

      const pulse = Math.sin(b.phase) * 0.35 + 0.65;
      const r = b.r * pulse;
      const alpha = b.baseAlpha * pulse;

      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(r, 0.2), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${b.tint},${alpha})`;
      ctx.fill();

      if(opts.glow){
        ctx.beginPath();
        ctx.arc(b.x, b.y, Math.max(r * 2.4, 0.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${b.tint},${alpha * 0.06})`;
        ctx.fill();
      }
    });

    maybeSpawnComet();
    if(comet){
      comet.x += comet.vx;
      comet.y += comet.vy;
      comet.life++;

      const tailX = comet.x - comet.vx * 14;
      const tailY = comet.y - comet.vy * 14;
      const grad = ctx.createLinearGradient(tailX, tailY, comet.x, comet.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(255,255,255,0.9)');

      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(comet.x, comet.y);
      ctx.stroke();

      if(comet.life > comet.maxLife || comet.x < -30 || comet.x > w + 30 || comet.y > h + 30){
        comet = null;
      }
    }

    rafId = requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  resize();
  rafId = requestAnimationFrame(step);

  return {
    stop(){
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    }
  };
}

/* ============ PRELOADER SEQUENCE ============ */
const preloaderField = initBubbleField('preloaderCanvas', {
  count: 90,
  speed: 0.5,
  minR: 1,
  maxR: 3.4,
  minAlpha: 0.25,
  maxAlpha: 0.85,
  rise: true,
  glow: true
});

const preloaderFill = document.getElementById('preloaderFill');
const preloaderSub = document.getElementById('preloaderSub');
const preloader = document.getElementById('preloader');
const siteContent = document.getElementById('siteContent');

const LOAD_MESSAGES = [
  'Charting the file system…',
  'Plotting directory orbits…',
  'Calibrating storage telemetry…',
  'Rendering the star map…'
];

// animate the progress bar filling during the delay
requestAnimationFrame(() => {
  preloaderFill.style.width = '100%';
});

let msgIndex = 0;
const msgInterval = setInterval(() => {
  msgIndex = (msgIndex + 1) % LOAD_MESSAGES.length;
  preloaderSub.textContent = LOAD_MESSAGES[msgIndex];
}, 650);

const PRELOAD_DELAY = 2600; // ms — time the loader stays visible

window.addEventListener('load', () => {
  setTimeout(() => {
    clearInterval(msgInterval);
    preloaderSub.textContent = 'Ready.';

    // begin transition: fade/scale out preloader, fade/slide in site
    preloader.classList.add('pl-hide');
    siteContent.classList.add('sc-show');

    // stop the bubble animation once fully hidden to save cycles
    setTimeout(() => {
      if(preloaderField) preloaderField.stop();
      preloader.style.display = 'none';
    }, 950);
  }, PRELOAD_DELAY);
});


/* ============ GAUGE ============ */

const arc = document.getElementById('gaugeArc');
const gaugeText = document.getElementById('gaugePct');
const circumference = 2 * Math.PI * 96;

arc.style.strokeDasharray = circumference;
arc.style.strokeDashoffset = circumference;

function animateGauge(targetPct){
  targetPct = Math.max(0, Math.min(100, Number(targetPct) || 0));

  const startPct = Number(gaugeText.dataset.value || 0);
  const startTime = performance.now();
  const duration = 1200;

  function step(now){
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    const pct = startPct + (targetPct - startPct) * eased;

    arc.style.strokeDashoffset =
      circumference * (1 - pct / 100);

    gaugeText.textContent = pct.toFixed(1) + '%';

    if(progress < 1){
      requestAnimationFrame(step);
    }else{
      gaugeText.dataset.value = targetPct;
    }
  }

  requestAnimationFrame(step);
}







/* ============ SCAN BUTTON ============ */
async function triggerScan(){
  const hint = document.getElementById('scanHint');
  const scanPath = document.getElementById('scanPath').value.trim();

  if(!scanPath){
    hint.textContent = 'Please enter a directory path.';
    return;
  }

  hint.textContent = `Scanning ${scanPath} ...`;
  hint.style.color = 'var(--cyan)';

  try{
    const response = await fetch(`/api/scan?path=${encodeURIComponent(scanPath)}`);
    const data = await response.json();

    if(!response.ok || !data.ok){
      throw new Error(data.error || 'Scan failed');
    }

    console.log('StoragePulse scan result:', data);

    updateDashboard(data);

    hint.style.color = '';
    hint.textContent = `Scan complete — indexed ${data.nodeCount.toLocaleString()} files and ${data.folderCount.toLocaleString()} folders in ${data.root} · just now`;

  }catch(error){
    console.error(error);
    hint.style.color = '#e8618a';
    hint.textContent = `Scan failed — ${error.message}`;
  }
}

function formatBytes(bytes){
  bytes = Number(bytes) || 0;

  if(bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function updateDashboard(data){
  latestScanData = data;
  drawStorageGraph();
  const total = Number(data.disk?.total) || 0;
  const scannedSize = Number(data.totalSize) || 0;
  const fileCount = Number(data.nodeCount) || 0;
  const folderCount = Number(data.folderCount) || 0;

  document.getElementById('diskTotal').textContent =
    formatBytes(total);

  document.getElementById('diskUsed').textContent =
    formatBytes(scannedSize);

  document.getElementById('diskFree').textContent =
    fileCount.toLocaleString();

  document.getElementById('scanSize').textContent =
    formatBytes(scannedSize);

  document.getElementById('fileCount').textContent =
    fileCount.toLocaleString();

  document.getElementById('folderCount').textContent =
    folderCount.toLocaleString();

  const scanPercent = total > 0
    ? (scannedSize / total) * 100
    : 0;

  document.getElementById('driveUsedPct').textContent =
    total > 0
      ? scanPercent.toFixed(1) + '%'
      : '--';

  animateGauge(scanPercent);

  updateStorageBreakdown(data);
  updateFileTypes(data);
  updateDirectoryTable(data);

  console.log('Gauge calculation:', {
    driveTotal: total,
    scannedSize: scannedSize,
    percentage: scanPercent
  });
}
function updateStorageBreakdown(data){
  const treemap = document.getElementById('treemap');
  const legend = document.getElementById('treemapLegend');

  treemap.innerHTML = '';
  legend.innerHTML = '';

  const items = (data.topLevel || [])
    .filter(item => item.size > 0)
    .sort((a, b) => b.size - a.size);

  if(!items.length){
    treemap.innerHTML = '<div class="scan-hint">No files or folders found.</div>';
    return;
  }

  const total = items.reduce((sum, item) => sum + item.size, 0);

  const colors = [
    '#4fe8d0',
    '#9d8cff',
    '#ffb454',
    '#ff6ec7',
    '#5ea8ff',
    '#7ee787',
    '#c792ea',
    '#ffd166'
  ];

  items.forEach((item, index) => {
    const percentage = total > 0
      ? (item.size / total) * 100
      : 0;

    const block = document.createElement('div');

    block.className = 'tm-block';

    const color = colors[index % colors.length];

    block.style.background = color;

    const span = Math.max(
      2,
      Math.min(
        12,
        Math.round((percentage / 100) * 12)
      )
    );

    block.style.gridColumn = `span ${span}`;

    if(percentage < 8){
      block.classList.add('dark');
    }

    block.innerHTML = `
      <div class="tm-name">${item.name}</div>
      <div class="tm-size">
        ${formatBytes(item.size)} · ${percentage.toFixed(1)}%
      </div>
    `;

    treemap.appendChild(block);

    const legendItem = document.createElement('div');

    legendItem.className = 'legend-item';

    legendItem.innerHTML = `
      <span class="legend-sw" style="background:${color}"></span>
      <span>${item.name}</span>
    `;

    legend.appendChild(legendItem);
  });
}
function updateFileTypes(data){
  const canvas = document.getElementById('donutCanvas');
  const ctx = canvas.getContext('2d');
  const list = document.getElementById('donutList');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  list.innerHTML = '';

  const sizes = data.fileTypeSizes || {};
  const total = Object.values(sizes).reduce((sum, value) => sum + value, 0);

  if(!total){
    list.innerHTML = '<div class="scan-hint">No file data available.</div>';
    return;
  }

  const categories = Object.entries(sizes)
    .filter(([category, size]) => size > 0)
    .sort((a, b) => b[1] - a[1]);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 58;
  const lineWidth = 18;

  const categoryColors = {
    code: '#4fe8d0',
    documents: '#ffb454',
    media: '#9d8cff',
    applications: '#ff6ec7',
    system: '#6b7bb3',
    other: '#454f72'
  };

  let startAngle = -Math.PI / 2;

  categories.forEach(([category, size]) => {
    const percentage = size / total;
    const endAngle = startAngle + percentage * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      startAngle,
      endAngle
    );

    ctx.strokeStyle = categoryColors[category] || '#596979';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();

    startAngle = endAngle;

    const row = document.createElement('div');
    row.className = 'donut-row';

    const count = data.fileTypeCounts?.[category] || 0;

    row.innerHTML = `
      <span class="sw" style="background:${categoryColors[category] || '#596979'}"></span>
      <span class="name">${category}</span>
      <span class="pct">${(percentage * 100).toFixed(1)}% · ${count}</span>
    `;

    list.appendChild(row);
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#0d1024';
  ctx.fill();
}
function updateDirectoryTable(data){
  const tbody = document.getElementById('dirTableBody');

  tbody.innerHTML = '';

  const items = data.topLevel || [];
  const total = data.totalSize || 1;

  items.forEach(item => {
    const row = document.createElement('tr');

    const percentage = (item.size / total) * 100;

    row.innerHTML = `
      <td>
        <div class="dir-name">
          <span class="dir-icon"></span>
          <span>${item.name}</span>
        </div>
      </td>
      <td>
        <div class="dir-size">${formatBytes(item.size)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.min(percentage, 100)}%"></div>
        </div>
      </td>
      <td>
        <span class="dir-pct">${percentage.toFixed(1)}%</span>
      </td>
      <td>
        <span class="dir-mod">${new Date(item.modified).toLocaleString()}</span>
      </td>
    `;

    tbody.appendChild(row);
  });
}
/* ============ HEADER / FOOTER BUBBLE FIELDS ============ */
initBubbleField('headerCanvas', {
  count: 55,
  speed: 0.22,
  minR: 1,
  maxR: 2.6,
  minAlpha: 0.2,
  maxAlpha: 0.7,
  rise: false,
  glow: true,
  comet: true
});

initBubbleField('footerCanvas', {
  count: 40,
  speed: 0.12,
  minR: 0.8,
  maxR: 2,
  minAlpha: 0.15,
  maxAlpha: 0.5,
  rise: false,
  glow: false
});
function toggleAI(){
    document.getElementById('ai-panel').classList.toggle('active');
  }
 
  function appendMessage(text, who){
    const msgs = document.getElementById('ai-messages');
    const el = document.createElement('div');
    el.className = 'ai-message ai-' + who;
    el.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }
 
 async function askAI(question){
  appendMessage(question, 'user');

  if(!latestScanData){
    appendMessage('Please run a scan first so I can analyze your storage.', 'bot');
    return;
  }

  appendMessage('Analyzing your storage...', 'bot');

  try{
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: question,
        scanData: latestScanData
      })
    });

    const data = await response.json();

    if(!response.ok || !data.ok){
      throw new Error(data.error || 'AI request failed');
    }

    appendMessage(data.answer, 'bot');

  }catch(error){
    console.error('AI error:', error);
    appendMessage('Sorry, I could not analyze your storage right now.', 'bot');
  }
}
 
  function sendAIMessage(){
    const input = document.getElementById('ai-input');
    const val = input.value.trim();
    if(!val) return;
    askAI(val);
    input.value = '';
  }
 
  function handleAIKey(e){
    if(e.key === 'Enter') sendAIMessage();
  }
  /* ============ WHY SECTION REVEAL ============ */

const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
},{
  threshold:0.15
});

revealElements.forEach(element => {
  revealObserver.observe(element);
});


/* ============ WHY SECTION TYPEWRITER ============ */

const typewriter = document.getElementById('whyTypewriter');

const typewriterText =
  'Your file system is a map. StoragePulse helps you read it.';

let typewriterStarted = false;

function startTypewriter(){
  if(!typewriter || typewriterStarted) return;

  typewriterStarted = true;

  typewriter.textContent = '';
  typewriter.classList.add('typing');

  let index = 0;

  function type(){
    if(index < typewriterText.length){
      typewriter.textContent += typewriterText.charAt(index);
      index++;
      setTimeout(type,38);
    }else{
      setTimeout(() => {
        typewriter.classList.remove('typing');
      },800);
    }
  }

  type();
}

if(typewriter){
  const typewriterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        startTypewriter();
        typewriterObserver.unobserve(entry.target);
      }
    });
  },{
    threshold:0.5
  });

  typewriterObserver.observe(typewriter);
}
/* ============ STORAGE ANALYTICS GRAPH ============ */

const storageGraph = document.getElementById('storageGraph');
const graphTotal = document.getElementById('graphTotal');
const graphUsed = document.getElementById('graphUsed');
const graphFree = document.getElementById('graphFree');
const graphFiles = document.getElementById('graphFiles');

function formatGraphSize(bytes){
  bytes = Number(bytes) || 0;

  if(bytes <= 0) return '0 B';

  const units = ['B','KB','MB','GB','TB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024,index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function drawStorageGraph(){
  if(!storageGraph || !latestScanData) return;

  const ctx = storageGraph.getContext('2d');

  const rect = storageGraph.getBoundingClientRect();

  if(rect.width === 0 || rect.height === 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  storageGraph.width = rect.width * dpr;
  storageGraph.height = rect.height * dpr;

  ctx.setTransform(dpr,0,0,dpr,0,0);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0,0,width,height);

  const total = Number(latestScanData.disk?.total) || 0;
  const used = Number(latestScanData.totalSize) || 0;
  const free = Math.max(total - used,0);
  const fileCount = Number(latestScanData.nodeCount) || 0;

  const values = [used,free];
  const labels = ['Used','Free'];

  const padding = {
    top:30,
    right:25,
    bottom:45,
    left:50
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(total,1);

  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'right';

  for(let i=0;i<=4;i++){
    const y =
      padding.top +
      chartHeight -
      (chartHeight * i / 4);

    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(padding.left,y);
    ctx.lineTo(width-padding.right,y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(154,163,201,.65)';

    ctx.fillText(
      formatGraphSize(maxValue * i / 4),
      padding.left - 8,
      y + 3
    );
  }

  const barWidth = Math.min(110,chartWidth / 4);
  const gap = Math.min(55,chartWidth / 7);

  values.forEach((value,index)=>{
    const x =
      padding.left +
      chartWidth / 2 +
      (index === 0
        ? -(barWidth + gap / 2)
        : gap / 2);

    const barHeight =
      total > 0
        ? (value / maxValue) * chartHeight
        : 0;

    const y =
      padding.top +
      chartHeight -
      barHeight;

    const gradient =
      ctx.createLinearGradient(
        0,
        y,
        0,
        padding.top + chartHeight
      );

    if(index === 0){
      gradient.addColorStop(
        0,
        '#4fe8d0'
      );

      gradient.addColorStop(
        1,
        'rgba(79,232,208,.12)'
      );
    }else{
      gradient.addColorStop(
        0,
        '#9d8cff'
      );

      gradient.addColorStop(
        1,
        'rgba(157,140,255,.12)'
      );
    }

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.roundRect(
      x,
      y,
      barWidth,
      Math.max(barHeight,3),
      10
    );

    ctx.fill();

    ctx.fillStyle = '#eef1ff';
    ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    ctx.fillText(
      formatGraphSize(value),
      x + barWidth / 2,
      Math.max(y - 9,15)
    );

    ctx.fillStyle = '#9aa3c9';
    ctx.font = '10px JetBrains Mono, monospace';

    ctx.fillText(
      labels[index],
      x + barWidth / 2,
      padding.top + chartHeight + 25
    );
  });

  if(graphTotal){
    graphTotal.textContent =
      formatGraphSize(total);
  }

  if(graphUsed){
    graphUsed.textContent =
      formatGraphSize(used);
  }

  if(graphFree){
    graphFree.textContent =
      formatGraphSize(free);
  }

  if(graphFiles){
    graphFiles.textContent =
      fileCount.toLocaleString();
  }
}

window.addEventListener(
  'resize',
  drawStorageGraph
);