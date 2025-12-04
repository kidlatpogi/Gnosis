# 🧠 Gnosis - Social Flashcard Platform

Gnosis is a modern flashcard application built with React and Firebase, featuring intelligent spaced repetition to help you master any subject effectively.

## 🚀 Tech Stack

- **Frontend**: React.js with Vite
- **Styling**: Bootstrap 5 (react-bootstrap)
- **Icons**: Lucide React
- **Backend**: Firebase v9 (Authentication & Firestore)
- **Routing**: React Router v6
- **Algorithm**: Modified SM-2 Spaced Repetition

## ✨ Features

- 🔐 **Google Authentication** - Secure login with Firebase Auth
- 📚 **Deck Management** - Browse and study multiple flashcard decks
- 🧠 **Smart Spaced Repetition** - Modified SM-2 algorithm for optimal learning
- ❤️ **Unlimited Hearts** - Learn at your own pace without penalties
- 💡 **Unlimited Hints** - Get help when you need it (caps quality rating)
- 📊 **Progress Tracking** - Track your mastery across all decks
- 🎯 **Due Card System** - Only review cards that are due for optimal retention

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd gnosis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase** (See detailed instructions below)

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔥 Firebase Setup (IMPORTANT!)

### Step 1: Create/Select Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing "Gnosis" project

### Step 2: Enable Firestore Database

1. In the left sidebar, expand **Build** → **Firestore Database**
2. Click **Create Database**
3. **Location**: Select the region closest to your users (e.g., `asia-southeast1` or `us-central1`)
4. **Security Rules**: Select **"Start in test mode"** (for development)
   - ⚠️ This allows immediate read/write access during development
   - ⚠️ Remember to update rules before production!
5. Click **Create**

### Step 3: Enable Authentication

1. In the left sidebar, click **Authentication**
2. Click **Get Started**
3. Select **Google** from the Sign-in providers
4. Toggle **Enable** and click **Save**

### Step 4: Get Your Firebase Config

1. Click the **Gear Icon** (Project Settings) → **General**
2. Scroll to **"Your apps"** section
3. Click the **</>** (Web) icon
4. Register the app with nickname: `gnosis-web`
5. Copy the `firebaseConfig` object

### Step 5: Update Your Code

Replace the placeholder config in `src/lib/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 6: Seed Sample Decks

1. Make sure Firebase config is updated
2. Start your development server (`npm run dev`)
3. Open the browser console (F12)
4. Copy and paste this code:

```javascript
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

const sampleDecks = [
  {
    id: 'react-basics',
    title: 'React Basics',
    subject: 'Programming',
    cards: [
      { id: 'react-1', front: 'What is JSX?', back: 'JSX is a syntax extension for JavaScript...' },
      // Add more cards
    ]
  }
];

async function seedDecks() {
  for (const deck of sampleDecks) {
    await setDoc(doc(db, 'decks', deck.id), deck);
    console.log(`Seeded deck: ${deck.title}`);
  }
  console.log('All decks seeded!');
}

seedDecks();
```

Or import and use the pre-made sample data from `src/utils/seedData.js`

## 🗂️ Project Structure

```
gnosis/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation bar with auth
│   │   └── StudyCard.jsx       # Flashcard component
│   ├── contexts/
│   │   └── AuthContext.jsx     # Global auth state
│   ├── lib/
│   │   └── firebase.js         # Firebase configuration
│   ├── pages/
│   │   ├── Dashboard.jsx       # Deck selection view
│   │   ├── Login.jsx           # Authentication page
│   │   └── Study.jsx           # Study session page
│   ├── utils/
│   │   ├── sm2_algorithm.js    # Spaced repetition logic
│   │   └── seedData.js         # Sample deck data
│   ├── App.jsx                 # Main app with routing
│   └── main.jsx                # Entry point
├── package.json
└── vite.config.js
```

## 🧮 SM-2 Algorithm

Gnosis uses a modified SuperMemo 2 (SM-2) algorithm with these features:

- **Quality Ratings**: 0-5 scale
  - 0: Complete blackout
  - 1-2: Incorrect (resets to 1 day)
  - 3: Hard (correct with difficulty)
  - 4: Good (correct with hesitation)
  - 5: Easy (perfect recall)

- **Modifications**:
  - Unlimited hearts - wrong answers reset interval to 1 day
  - Hints cap quality at 2 (Hard)
  - Dynamic ease factor adjustment

## 📱 Database Structure

### Collections

**users/{uid}**
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

**decks/{deckId}**
```javascript
{
  title: string,
  subject: string,
  cards: [
    {
      id: string,
      front: string,
      back: string
    }
  ]
}
```

**user_progress/{userId}_{deckId}**
```javascript
{
  cards: {
    [cardId]: {
      cardId: string,
      interval: number,
      easeFactor: number,
      nextReviewDate: timestamp,
      lastReviewed: timestamp,
      reviewCount: number
    }
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables if needed
5. Deploy!

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🔒 Security Rules (Production)

Before deploying, update Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read decks
    match /decks/{deckId} {
      allow read: if true;
      allow write: if false; // Only admins can write
    }
    
    // Users can only access their own progress
    match /user_progress/{progressId} {
      allow read, write: if request.auth != null && 
        progressId.matches(request.auth.uid + '.*');
    }
  }
}
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ❤️ using React, Bootstrap, and Firebase
