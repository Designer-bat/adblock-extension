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
