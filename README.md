# StoragePulse

**StoragePulse** is a file-system storage analyzer and disk usage
visualizer developed as an Operating Systems coursework project.

It scans a selected directory, analyzes storage usage, classifies files,
and presents the results through an interactive dashboard.

## Features

-   Real-time directory scanning
-   File and folder size analysis
-   File-type classification
-   Storage breakdown visualization
-   Top-level directory explorer
-   Storage analytics
-   Storage analysis assistant

## How It Works

``` text
User selects directory
        ↓
Frontend sends scan request
        ↓
Backend scans file system
        ↓
Files and folders are analyzed
        ↓
Sizes, counts and file types are calculated
        ↓
JSON data returned to frontend
        ↓
Dashboard displays storage insights
```

## Tech Stack

  Layer              Technology
  ------------------ --------------------------
  Frontend           HTML, CSS, JavaScript
  Backend            Node.js, Express.js
  Storage Analysis   Node.js File System APIs
  Charts             JavaScript
  AI Assistant       Groq API

## Project Structure

``` text
StoragePulse/
├── public/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Contribution

This was completed as a **group project**, with **Rupayan Chattaraj
leading the project from planning and development through integration
and completion**.

  -----------------------------------------------------------------------
  Member                              Contribution
  ----------------------------------- -----------------------------------
  **Rupayan Chattaraj**               **Project Lead --- End-to-end
                                      development, architecture, backend,
                                      frontend, integration, testing and
                                      final implementation**

  Himashu                             Assisted with testing, debugging
                                      and project feedback

  Nagendra                            Assisted with testing, UI feedback
                                      and documentation support
  -----------------------------------------------------------------------

## Project Purpose

StoragePulse demonstrates Operating Systems concepts through practical
file-system analysis, storage accounting, directory traversal, file
classification, and interactive visualization.
