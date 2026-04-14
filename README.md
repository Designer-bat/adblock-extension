# 🛡️ Shield - Ultimate Ad Blocker (Chrome Extension)

A lightning-fast, lightweight, and privacy-focused ad blocker powered by **Manifest V3**.  
Designed to deliver a seamless web experience by stopping intrusive ads, skipping YouTube video ads, and protecting against phishing trackers without logging what you do.

---

## ✨ Key Features

* 🚫 **Comprehensive Network Blocking:** Uses the `declarativeNetRequest` API to kill trackers and ad requests before they even load.
* 🎥 **YouTube Ad Skipping:** Specialized, custom DOM injectors seamlessly bypass unskippable video ads.
* 🎨 **Premium UI/UX:** A beautiful, card-based interface with subtle micro-animations and native **Dark Mode** & Light Mode support.
* 🌐 **Built-in Localization (i18n):** Instantly switch between 6+ languages dynamically from the popup, no reloads required!
* 📊 **Live Analytics & Charts:** Visual weekly charting and real-time blocked stat counters inside your popup.
* 🎛️ **Granular Control:** Create custom domain filters, whitelist your favorite sites with one click, and view a real-time debug event log.
* 🔒 **100% Privacy Focused:** Works entirely offline. Zero analytics, zero telemetry.

---

## 🧠 How It Works

This extension leverages multiple overlapping techniques to ensure the web stays clean:

### 1. Network-Level Blocking (`declarativeNetRequest`)
By loading dynamic and static rules natively via `rules.json`, Shield intercepts connections and nullifies tracking scripts and ad networks instantly. It saves your bandwidth and significantly improves load times.

### 2. DOM Cleansing (`content.js` & `youtube.js`)
Removes leftover structural elements from pages—like blank banners or modal popups. It also injects highly specialized scripts exclusively onto YouTube to intercept video-ad triggers.

### 3. Service Worker State & Performance (`background.js`)
Tracks stats, caches data safely utilizing Chrome's Sync storage, and manages real-time messaging between your browser tabs and the UI.

---

## 🌐 Supported Languages
Shield includes a dynamic language selector allowing users natively to view the extension in:
* 🇺🇸 English
* 🇪🇸 Spanish (Español)
* 🇫🇷 French (Français)
* 🇩🇪 German (Deutsch)
* 🇳🇵 Nepali (नेपाली)
* 🇨🇳 Chinese (中文)

---

## 📁 Project Structure

```text
ultimate-ad-blocker/
│
├── manifest.json        # Extension config (Manifest V3 permissions)
├── rules.json           # Native declarativeNetRequest network block rules
├── background.js        # Background service worker (Stats & state mgmt)
├── content.js           # Generic DOM-level ad & overlay remover
├── youtube.js           # Dedicated YouTube ad-blocking mechanism
├── popup.html           # Core UI popup Layout 
├── popup.js             # UI interactions, graphing, and logic mapping
├── i18n.js              # Localization strings & dynamic translation engine
├── icon128.png          # App branding & extension icons
```

---

## 🚀 Installation for Users & Developers

1. **Clone or Download** this repository.
2. Open Chrome and type `chrome://extensions/` in the URL bar.
3. Toggle **Developer mode** on (top right corner).
4. Click **Load unpacked** and select the folder you downloaded containing the extension files.
5. 📌 **Pin** the extension to your toolbar. Test it out on a media site, toggle your languages, and try dark mode!

---

## ⚙️ Extension Customization

### Adding Custom Filters
Click the **Filters** tab within the extension popup and type the domain you wish to block (e.g., `ads.annoying-site.com`). Shield immediately targets it.

### Whitelisting a Website
To support a creator, open the extension while on their site and click **"Whitelist Site"**. Shield will temporarily deactivate its rules for that specific domain.

---

## 🔒 Privacy Guarantee

This extension exists for your protection and privacy. 
* ❌ **NO** data scraping or user telemetry.
* ❌ **NO** browsing history tracking.
* ✅ Runs 100% on-device utilizing modern local-storage APIs.

---

## 🛠️ Tech Stack

* **HTML/CSS/JS (Vanilla):** Designed for maximum speed and minimum bundle size.
* **Chrome Extension API (Manifest V3):** Secure, modern architecture preventing remote code injection.
* **Canvas API:** Generating dynamic embedded visual statistical graphs.

---

## 👨‍💻 Author

Developed by **Swostik**  
Student & Graphic Designer | BIM

### ⭐ Support the Project
If you enjoy an ad-free web experience, please consider dropping a ⭐ on the GitHub repository or reaching out to collaborate!

> *"Clean web, better experience."*
