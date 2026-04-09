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