# FormFillAI

**AI-powered smart form autofill system** — web dashboard + Chrome extension + Firebase backend.

---

## 🗂 Project Structure

```
FormFillAI/
├── website/             # Web Dashboard (open index.html in browser)
│   ├── index.html       # Landing page
│   ├── login.html       # Login / Signup (Firebase Auth)
│   ├── dashboard.html   # Profile manager (Firebase Firestore)
│   ├── demo.html        # Interactive demo
│   ├── security.html    # Security & Privacy center
│   ├── css/style.css    # Shared styles
│   └── js/
│       ├── firebase-config.js  # Firebase init
│       ├── dashboard.js        # Profile CRUD
│       └── app.js              # Shared utilities
│
└── extension/           # Chrome Extension (Manifest V3)
    ├── manifest.json
    ├── popup.html       # Extension popup UI
    ├── popup.js         # Auth + Firestore (REST API) + messaging
    ├── content.js       # Smart field detection & autofill
    ├── background.js    # Service worker
    └── icons/           # Extension icons
```

---

## 🚀 Quick Start

### 1. Open the Website

Just open `website/index.html` in your Chrome browser. No server needed!

> ⚠️ **Note:** Firebase Auth requires the page to be served over HTTP/HTTPS (not `file://`).  
> Use VS Code **Live Server** extension or Python's simple HTTP server:
```bash
cd website
python -m http.server 8080
# Then go to: http://localhost:8080
```

---

### 2. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle top-right)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The **FormFillAI** icon will appear in your toolbar!

---

### 3. Usage Flow

1. **Create an account** at `website/login.html`
2. Go to **Dashboard** → Add a new profile (fill in personal, address, professional, banking data)
3. Click the **FormFillAI extension icon** in Chrome
4. Sign in with the same account
5. Navigate to any form on the web
6. Select your profile in the extension popup
7. Click **"🤖 Autofill This Page"** — done!

---

## 🔥 Firebase Setup

The project uses:
- **Firebase Authentication** (email/password)
- **Cloud Firestore** for profile storage

### Firestore Security Rules
Go to Firebase Console → Firestore → Rules and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🧩 Smart Field Mapping

The extension detects and fills 30+ field types:

| Category | Fields |
|----------|--------|
| Personal | name, email, phone, date of birth |
| Address | street, city, state, zip, country |
| Professional | company, job title, LinkedIn, skills, bio |
| Banking | bank name, account number, routing, card details |

Matching uses: field `name`, `id`, `placeholder`, `aria-label`, `autocomplete`, and `label[for]` in priority order.

---

## 🛡 Security

- User data stored under `users/{uid}/profiles/` — completely isolated
- Firestore Security Rules enforce that only the authenticated owner can access their data
- Banking data stored encrypted in Firestore
- Extension uses Firebase REST API (no sensitive keys exposed beyond `apiKey` which is safe for client-side use)

---

## 📋 Tech Stack

| Component | Technology |
|-----------|-----------|
| Website | HTML5, Vanilla CSS, Vanilla JS |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Extension | Chrome MV3, REST API |
| Fonts | Google Fonts (Inter) |

---

*© 2025 FormFillAI — Built from scratch*
