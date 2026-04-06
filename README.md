# Text Extractor Extension

**Click it. Capture it. Export it.** A Chrome extension that extracts text from any element on the page: click the element or move focus with **Arrow keys** / **Tab**. Each capture is added as a new line. No limit—capture as many as you like, across **any tab** in the same window; all go into one list. Export to TXT, CSV, or Excel with one click.

## Setup

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension` folder in this repo.

## Usage

1. Click the extension icon. The **side panel** opens.
2. Click **Start extraction**. The listener is injected into **all tabs** in the current window. The Start button is disabled and **Stop extraction** is enabled.
3. In any of those tabs:
   - **Click** any element to capture its text, or
   - Use **Arrow keys** or **Tab** to move focus; the focused element’s text is captured on each move.
   - Clicks on **links and buttons** only capture text—they do not navigate or submit.
4. Each capture is added on a new line in the text area. No limit on how many you capture.
5. Click **Stop extraction** when done. Listeners are removed from all tabs; Stop is disabled and Start is enabled again.

## Export

Below the text area you can export the list to:

- **Export TXT** — Plain text, one line per capture (UTF-8).
- **Export CSV** — Single column with header, comma/quote-safe (UTF-8 with BOM).
- **Export XLSX** — Excel-compatible file (`.xls`) that opens in Excel.

Files are named like `text-extractor-YYYY-MM-DD` with the right extension.