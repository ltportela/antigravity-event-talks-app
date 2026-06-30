# BigQuery Release Notes Dashboard

A modern, responsive web application designed to fetch, parse, and display the official release notes for Google Cloud BigQuery. The project features a premium UI design, automated text processing, and a built-in integration to preview and share updates directly to Twitter/X.

## Features

- **Real-Time Feed Integration:** Dynamically fetches and parses the official BigQuery release notes Atom/RSS XML feed from Google Cloud.
- **Smart Text Extraction:** Automatically cleans HTML content and generates concise plain-text summaries optimized for sharing.
- **Twitter/X Sharing Modal:** Includes a custom tweet composer pre-filled with the update title, clean text summary, and resource link (automatically truncated to comply with the 280-character limit).
- **Premium Aesthetics:** Built with a dark mode theme, responsive grid layouts, custom modern typography (Outfit and Plus Jakarta Sans), smooth micro-animations, and styled scrollbars.
- **Robust Error Handling:** Features clear visual loading states and retry interfaces for network or parsing errors.

## Tech Stack

- **Backend:** Python 3, Flask, `feedparser`, `requests`
- **Frontend:** HTML5 (semantic structure), Vanilla CSS3 (custom properties, flexbox/grid, animations), Vanilla JavaScript (ES6, Fetch API)

---

## Directory Structure

```text
agy-cli-projects/
├── app.py                  # Flask server and API endpoint logic
├── templates/
│   └── index.html          # Dashboard structure and share modals
├── static/
│   ├── style.css           # Premium styling, variables, and responsive layout
│   └── app.js              # Fetching, DOM rendering, and share dialog logic
├── .gitignore              # Configured Git ignore files for Python
└── README.md               # Project documentation (this file)
```

---

## Getting Started

### Prerequisites

Make sure you have Python 3 installed on your machine. You will also need to install the project dependencies:

```bash
pip install Flask requests feedparser
```

### Running the Application

1. Open your terminal in the project directory.
2. Start the Flask development server:
   ```bash
   python app.py
   ```
3. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

---

## How It Works

1. **Backend Fetching & Parsing:** When a request is made to the `/api/release-notes` endpoint, `app.py` makes a HTTP GET request to retrieve the BigQuery release notes XML. It parses the feed using `feedparser`, loops through all entries, cleans the HTML tags using regular expressions, and formats a clean JSON payload.
2. **Frontend Rendering:** `app.js` issues a `fetch()` request to `/api/release-notes`, parses the JSON response, dynamically constructs card structures for each release note, and appends them to the DOM.
3. **Sharing System:** Clicking the "Tweet" button on any release card extracts that note's metadata and populates a custom modal dialog. The JavaScript ensures character counts are computed and kept under the 280-character threshold before generating a pre-filled Twitter Web Intent URL.
