# Text Extractor

A Chrome extension that extracts text from any element on the page: **click** the element or **move focus** with arrow keys / Tab, and its text is added to the list (one line per capture).

## Setup

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension` folder in this repo.

## Usage

1. Click the extension icon. The **side panel** opens.
2. Click **Start extraction**, then:
   - **Click** any element on the page to capture its text, or
   - Use **Arrow keys** or **Tab** to move focus; the focused element’s text is captured on each move.
3. Each capture is added on a new line in the text area.
4. Click **Stop extraction** when done.

**Debug:** Open the **Debug log** section in the side panel to see injection and click/arrow events. Right‑click the side panel → **Inspect** for the extension console.
