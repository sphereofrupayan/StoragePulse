# StoragePulse

StoragePulse is a **file-system storage analyzer and disk usage
visualizer** built as an Operating Systems coursework project.

It scans a selected directory, calculates storage usage, counts files
and folders, classifies files by type, and presents the results through
visual dashboards. It also includes a StoragePulse AI assistant that can
answer questions using the latest scan data.

## How It Works

``` mermaid
flowchart TD
    A[User enters directory path] --> B[Scan Directory]
    B --> C[Frontend sends GET /api/scan]
    C --> D[Backend scans the file system]
    D --> E[Traverse files and folders]
    E --> F[Calculate sizes and counts]
    E --> G[Classify file types]
    D --> H[Read drive capacity]
    F --> I[Return scan JSON]
    G --> I
    H --> I
    I --> J[Frontend updates dashboard]
    J --> K[System Overview]
    J --> L[Storage Breakdown]
    J --> M[File Type Distribution]
    J --> N[Top-Level Explorer]
    J --> O[Storage Analytics Graph]
    J --> P[latestScanData]
    P --> Q[StoragePulse AI]
    Q --> R[AI analyzes scan data and answers user]
```

## Main Workflow

### 1. Select a directory

The user enters a directory path in the scan field and clicks **Scan
Directory**.

Example:

``` text
C:\Users\rupay\OneDrive\Desktop\Projects\StoragePulse
```

### 2. Start the scan

The frontend calls:

``` text
GET /api/scan?path=<selected-directory>
```

The scan request is handled by the backend.

### 3. Traverse the file system

The backend walks through the selected directory and examines its files
and folders.

During the scan, StoragePulse collects information such as:

-   File and folder names
-   File sizes
-   Number of files
-   Number of folders
-   Modification information
-   File-type categories
-   Total scanned size
-   Drive capacity information

### 4. Return scan data

The backend sends the collected information back to the frontend as
JSON.

The frontend stores the latest result in:

``` javascript
latestScanData
```

This data becomes the common source for the dashboard and AI assistant.

### 5. Update the dashboard

The scan result is used to update several visual components:

-   **System Overview** --- scanned size, file count, folder count, and
    drive usage.
-   **Storage Breakdown** --- top-level files/folders are represented as
    proportional colored blocks.
-   **File Type Distribution** --- shows how storage is distributed
    among categories such as code, documents, media, applications,
    system, and other.
-   **Top-Level Explorer** --- displays names, sizes, storage share, and
    modification time.
-   **Storage Analytics** --- compares used and free storage
    graphically.

## Storage Breakdown

The Storage Breakdown is generated from the scanned top-level items.

Each item's percentage is calculated approximately as:

``` text
item percentage = item size / total top-level size × 100
```

Larger items receive larger visual blocks, making it easy to identify
what is consuming the most space.

## File Type Distribution

Files are grouped into categories based on their type.

The dashboard visualizes the resulting storage distribution using a
donut chart and a category list.

This makes it easier to answer questions such as:

-   How much storage is occupied by code?
-   How much space is used by media?
-   Which file category occupies the most space?

## Storage Analytics

The analytics graph uses the latest scan data to calculate:

``` text
Used  = scanned size
Free  = total drive capacity - scanned size
```

It then displays the values as a visual comparison.

> Note: the scanned size represents the directory selected for analysis,
> while drive information represents the underlying storage volume.

## StoragePulse AI

The dashboard includes a **StoragePulse AI** assistant.

The AI assistant uses:

``` text
User Question
      +
Latest Scan Data
      ↓
Backend AI Request
      ↓
Storage Analysis
      ↓
AI Answer
```

The frontend sends the question together with `latestScanData` to:

``` text
POST /api/ai
```

This allows the assistant to answer questions based on the current scan
rather than using unrelated or fixed storage values.

Example questions:

``` text
Which folder is using the most storage?
What is the total storage of my drive?
How many files and folders were scanned?
```

A scan must be completed before the AI can analyze the storage.

## Frontend Structure

The frontend is divided into three main files:

``` text
index.html
styles.css
script.js
```

### `index.html`

Defines the page structure and dashboard sections:

-   Navigation
-   Scan interface
-   System Overview
-   Storage Breakdown
-   File Type Distribution
-   Directory Explorer
-   Analytics
-   Why StoragePulse
-   StoragePulse AI interface

### `styles.css`

Controls the visual appearance of the application, including:

-   Layout
-   Typography
-   Colors
-   Cards and panels
-   Treemap styling
-   Tables
-   Responsive design
-   Animations
-   AI assistant interface

### `script.js`

Contains the frontend logic for:

-   Scan requests
-   Dashboard updates
-   Storage calculations
-   Treemap generation
-   Donut chart rendering
-   Directory table rendering
-   Analytics graph
-   AI requests
-   Animated UI effects

## Backend Concept

The backend provides the API layer between the browser and the local
file system.

Conceptually:

``` text
Browser
   │
   ├── /api/scan ──→ File System Scanner
   │                       │
   │                       ├── Traverse directories
   │                       ├── Calculate sizes
   │                       ├── Count files/folders
   │                       └── Classify file types
   │
   └── /api/ai ────→ AI Analysis
```

This separation keeps file-system operations on the backend while the
frontend focuses on visualization and interaction.

## Key Concepts Demonstrated

StoragePulse connects practical implementation with Operating Systems
concepts:

### File-System Traversal

The application recursively explores directories and files to build a
representation of the selected storage area.

### Storage Accounting

File sizes are accumulated to determine how much storage is occupied by
the scanned directory.

### Directory Hierarchy

Files and folders are represented as a tree-like structure during
scanning and then summarized visually.

### File Classification

Files are grouped into categories to provide a high-level view of
storage usage.

### Visualization

Raw file-system information is converted into:

-   Treemap-style storage blocks
-   Donut charts
-   Tables
-   Storage graphs
-   Summary statistics

## Quick Start

Install the project dependencies:

``` bash
npm install
```

Start the server using the project's configured start command.

Then open the application in a browser and enter a directory path that
the server can access.

## Important Notes

-   StoragePulse analyzes the directory path provided to the scanner.
-   The displayed dashboard values are refreshed after every successful
    scan.
-   The AI assistant requires a completed scan because it uses the
    latest scan data.
-   The scan can contain a large number of files, so scanning a large
    directory may take longer.
-   Access to protected or restricted directories depends on the
    permissions of the process running the server.
-   The project is intended primarily as an educational Operating
    Systems project and storage visualization tool.

## Project Flow in One View

``` text
Directory Path
      ↓
   Scan API
      ↓
File-System Traversal
      ↓
Size + Count + Type Analysis
      ↓
     JSON
      ↓
Dashboard Visualization
      ↓
Latest Scan Data
      ↓
 StoragePulse AI
```

## Project Purpose

StoragePulse was designed to make file-system storage easier to
understand by combining **real directory analysis**, **Operating Systems
concepts**, and **interactive visualization** in a single application.
#   S t o r a g e P u l s e  
 