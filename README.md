# 🚫 Ultimate Ad Blocker (Chrome Extension)

A fast, lightweight, and privacy-focused ad blocker built using **Manifest V3**.
This extension blocks unwanted ads and popups while maintaining performance and stability across modern websites.

---

## ✨ Features

* 🚫 Blocks common ad networks (Google Ads, DoubleClick, Amazon Ads, etc.)
* 🧹 Removes popups, banners, and overlay elements
* 🔢 Real-time badge counter (shows number of blocked requests)
* ⚡ Built with **declarativeNetRequest** for high performance
* 🔒 No data collection – works fully locally
* 🎛️ Simple ON/OFF toggle interface

---

## 🧠 How It Works

This extension uses two main techniques:

### 1. Network-Level Blocking

* Uses Chrome’s **declarativeNetRequest API**
* Blocks requests to known ad domains before they load
* Improves speed and reduces bandwidth usage

### 2. DOM Cleaning

* Removes leftover ad elements from the page
* Targets:

  * iframes with ads
  * banner elements
  * popup dialogs and overlays

### 3. Badge Counter

* Tracks blocked requests
* Displays count on extension icon in real time

---

## 📁 Project Structure

```
ultimate-ad-blocker/
│
├── manifest.json        # Extension configuration (Manifest V3)
├── rules.json           # Network blocking rules
├── content.js           # DOM ad & popup remover
├── background.js        # Badge counter logic
├── popup.html           # Extension UI
├── popup.js             # UI logic (toggle + stats)
├── icon128.png          # Extension icon
```

---

## 🚀 Installation (Development)

1. Clone or download this repository
2. Open Chrome and go to:
   chrome://extensions/
3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select the project folder

---

## 📦 Build & Publish

1. Zip the project folder
2. Go to Chrome Web Store Developer Dashboard
3. Upload the ZIP file
4. Fill in listing details (name, description, screenshots)
5. Submit for review

---

## 🔒 Privacy Policy

This extension:

* ❌ Does NOT collect user data
* ❌ Does NOT track browsing activity
* ✅ Runs entirely on the user’s device
* ✅ Only blocks ad-related requests

---

## ⚠️ Limitations

* Cannot block every ad (especially advanced or embedded ads)
* Some websites may break if they rely heavily on ad scripts
* Badge counter reflects network-blocked requests only

---

## 💡 Future Improvements

* 🌐 Website whitelist feature
* 📊 Detailed analytics dashboard
* 🎨 Improved UI/UX design
* 🔄 Dynamic filter list updates
* 🎯 Per-site ad blocking stats

---

## 🛠️ Tech Stack

* JavaScript (Vanilla)
* Chrome Extension API (Manifest V3)
* declarativeNetRequest API

---

## 📌 Disclaimer

This project is for educational and personal use.
It is designed to demonstrate how browser extensions can enhance user experience by reducing unwanted content.

---

## 👨‍💻 Author

Developed by **Swostik**
Student & Graphic Designer | BIM

---

## ⭐ Support

If you like this project:

* Give it a ⭐ on GitHub
* Share feedback
* Suggest improvements

---

## 📬 Contact

Feel free to reach out for collaboration or improvements.

---

> "Clean web, better experience."

# Ultimate Ad Blocker - Extension Setup Guide

## 📁 Files Overview

### Core Files
- **manifest.json** — Extension configuration and permissions
- **popup.html** — UI for the popup (stats, controls, chart)
- **popup.js** — Popup logic and interactions
- **background.js** — Service worker that manages storage and tracks blocked ads
- **content.js** — Script that runs on pages to block ads
- **rules.json** — Network-level ad blocking rules

### Icons (Required)
You need to create 3 PNG icon files:
- `icons/icon16.png` (16×16px)
- `icons/icon48.png` (48×48px)
- `icons/icon128.png` (128×128px)

Or use simple icons from [Google Icon Library](https://fonts.google.com/icons).

---

## 🚀 Installation Steps

### 1. Create the Extension Folder
```
ultimate-ad-blocker/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── rules.json
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2. Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `ultimate-ad-blocker` folder

### 3. Test It
- Visit a website with ads
- Click the extension icon in the toolbar
- You should see the ad count increasing

---

## 📊 How It Works

### Network-Level Blocking (rules.json)
- Blocks ad requests BEFORE they're loaded
- Targets: Google Ads, Facebook, Criteo, Taboola, etc.
- Most efficient method
- ~24 rules covering major ad networks

### DOM-Level Blocking (content.js)
- Removes ads already on the page
- Uses CSS selectors and patterns
- Handles dynamic ads added after page load
- Fallback for ads that bypass network rules

### Tracking (background.js)
- Counts total ads blocked
- Tracks per-domain stats
- Weekly breakdown for the chart
- Stores data in Chrome sync storage

---

## ⚙️ Configuration

### Add More Ad Networks
Edit `rules.json` to add more ad networks. Example:

```json
{
  "id": 25,
  "priority": 1,
  "action": { "type": "block" },
  "condition": {
    "urlFilter": "example-ads.com",
    "resourceTypes": ["script", "image", "xhr"]
  }
}
```

### Whitelist Sites
In the popup, click "Whitelist This Site" to disable blocking on that domain.

### Disable Extension
Click "Disable" in the popup to turn off ad blocking globally.

---

## 🐛 Troubleshooting

### Ads Still Show
- Refresh the page
- Check if the domain is whitelisted
- Verify the extension is enabled
- Add the ad network to rules.json

### Numbers Not Updating
- Check if "tabs" permission is enabled in manifest
- Open DevTools (F12) and check Console for errors
- Reload the extension (chrome://extensions/)

### Extension Crashes
- Check Console for JavaScript errors (F12)
- Verify rules.json is valid JSON (use [jsonlint.com](https://jsonlint.com))
- Ensure all required permissions are in manifest.json

---

## 🎨 Icons

Create simple icons using:
1. **Free tools**: [favicon-generator.org](https://www.favicon-generator.org)
2. **Design apps**: Figma, Photoshop
3. **AI**: ChatGPT with DALL-E ("Create a shield icon")
4. **Icon libraries**: 
   - [Phosphor Icons](https://phosphoricons.com)
   - [Heroicons](https://heroicons.com)
   - [Bootstrap Icons](https://icons.getbootstrap.com)

**Icon Requirements:**
- Format: PNG (transparency supported)
- Dimensions: Exactly 16×16, 48×48, 128×128
- Design: Simple, recognizable (shield, lock, filter symbol)

---

## 📋 Privacy & Safety

✅ **What this extension does:**
- Blocks ad requests at network level
- Tracks blocked ads count (local storage only)
- Stores stats in Chrome sync storage

❌ **What this extension does NOT do:**
- Collect user data
- Track browsing activity
- Send data to external servers
- Steal passwords or personal info

All data stays local to your device.

---

## 📈 Future Improvements

- [ ] Import/export blocklist
- [ ] Custom rules UI
- [ ] Performance metrics
- [ ] Domain-specific rules
- [ ] Block tracking (analytics.js)
- [ ] Video ad blocking

---

## 📝 License & Credits

This extension uses:
- Chrome Manifest V3 API
- Declarative Net Request API
- Chrome Storage Sync API

Built as a simple, privacy-focused ad blocker.

---

## ❓ Support

If you encounter issues:
1. Check the Console (F12 → Console tab)
2. Verify all files are in place
3. Ensure manifest.json is valid
4. Try reloading the extension
5. Restart Chrome

Happy ad-free browsing! 🛡️
