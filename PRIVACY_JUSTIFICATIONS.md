# Chrome Web Store – Privacy practices (copy-paste)

Use the text below on the **Privacy practices** tab when publishing Text Extractor.

---

## 1. Justification for **activeTab**

**Text Extractor** needs temporary access to the active tab only when the user clicks **Start extraction**. We use `activeTab` so that, after the user invokes the extension, we can inject a click listener into the current tab(s) to capture the text of elements the user clicks. We do not access any tab without explicit user action (clicking Start extraction).

---

## 2. Justification for **host permission use** (<all_urls>)

The extension must be able to run on any website the user chooses to extract text from. We use host permissions so that when the user clicks **Start extraction**, we can inject our listener into **all tabs in the current window** (including pages on any domain). We only read the **visible text** of the element the user clicks; we do not access form data, cookies, or other site data. The user controls when extraction is active (Start/Stop).

---

## 3. Justification for **remote code use**

We do not load or execute code from remote servers. The only “code” run in the page is **our own extension code** (the click-capture and keyboard-capture logic) injected via Chrome’s `scripting` API when the user clicks **Start extraction**. This is the standard way for extensions to add behavior to a tab; the code is bundled in the extension and never fetched from the network.

---

## 4. Justification for **scripting**

We use the **scripting** permission to inject a small script into the user’s open tabs when they click **Start extraction**. That script adds a click listener and a keyboard listener so we can capture the text of the element the user clicks or focuses. We also use scripting to remove those listeners when the user clicks **Stop extraction**. Without scripting, we could not offer click-to-extract or keyboard extraction on arbitrary web pages.

---

## 5. Justification for **sidePanel**

The extension’s only UI is the **side panel**. We use the side panel so the user can start/stop extraction, see the list of extracted text, and export to TXT/CSV/XLS without losing the current page. The side panel does not run in the page context and does not access page content except through the injected script described above.

---

## 6. Single purpose description

**Single purpose (narrow and easy-to-understand):**  
This extension has one purpose only: **to let users collect text from web pages by clicking elements (or using the keyboard) and export that list to a file.** It does not modify pages, track users, or do anything else.

---

## 7. Data usage (Privacy practices form)

**What user data do you plan to collect?**

- Select **Website content** only (text from pages the user chooses to extract).  
- Leave all other categories **unchecked**: personally identifiable information, health, financial, authentication, personal communications, location, web history, user activity.

**Public disclosure text** (for “Website content” – will be shown on the item page):

> This extension accesses **website content** only when you use it to extract text: it reads the visible text of the element you click or focus. That text is shown only in the extension’s side panel and can be exported to a file on your device. We do not collect, store, or send this data to any server. No other user data is collected.

**Certifications** (check all three):

- ☑ **I do not sell or transfer user data to third parties, outside of the approved use cases** — We do not sell or transfer any user data; extracted text is only displayed and exported locally.
- ☑ **I do not use or transfer user data for purposes that are unrelated to my item's single purpose** — The only data used is the text the user extracts, and only for the single purpose (collect and export).
- ☑ **I do not use or transfer user data to determine creditworthiness or for lending purposes** — Not applicable; we do not use data for this.

---

## 8. Contact email & verification

- **Contact email:** Enter your support/contact email on the **Account** tab in the Chrome Web Store Developer Dashboard.
- **Verification:** Complete the email verification process from the same Account tab before submitting the item for review.

---

*Copy each section into the corresponding field on the Privacy practices (and Account) tabs as needed.*
