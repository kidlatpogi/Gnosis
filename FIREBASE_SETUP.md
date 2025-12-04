# 🔥 Firebase Setup Instructions for Gnosis

## Important: Read This First!

Your Gnosis project is ready, but Firebase services need to be manually enabled. Follow these steps carefully.

---

## Step 1: Access Your Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click on your existing **"Gnosis"** project (don't create a new one!)

---

## Step 2: Enable Firestore Database

### Why? 
Firestore stores your flashcard decks and user progress data.

### Steps:

1. In the left sidebar, click **Build** → **Firestore Database**
2. Click the **"Create Database"** button
3. **Choose a location:**
   - Select a region close to your users
   - Examples: `us-central1`, `asia-southeast1`, `europe-west1`
   - ⚠️ **Cannot be changed later!**

4. **Start mode: Select "Test Mode"**
   - This allows immediate read/write access during development
   - ⚠️ **Important:** Test mode rules expire after 30 days
   - We'll update security rules later for production

5. Click **"Enable"**

### Verification:
You should see an empty Firestore Database dashboard with tabs: Data, Rules, Indexes, Usage

---

## Step 3: Enable Authentication

### Why?
Users need to log in to save their progress.

### Steps:

1. In the left sidebar, click **Authentication**
2. Click **"Get Started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **Enable** to ON
6. Select a **Support email** (your email)
7. Click **"Save"**

### Verification:
Google should now appear in your Sign-in providers list with status "Enabled"

---

## Step 4: Get Your Firebase Configuration

### Steps:

1. Click the **⚙️ Gear Icon** (top left) → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **`</>`** (Web app) icon
4. **App nickname:** Enter `gnosis-web`
5. ✅ Check **"Also set up Firebase Hosting"** (optional)
6. Click **"Register app"**
7. **Copy the `firebaseConfig` object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "gnosis-xxxxx.firebaseapp.com",
  projectId: "gnosis-xxxxx",
  storageBucket: "gnosis-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

---

## Step 5: Update Your Local Code

### Open `src/lib/firebase.js` in your code editor

Replace this placeholder:

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

With your actual config from Step 4.

---

## Step 6: Test Authentication

1. Make sure your dev server is running: `npm run dev`
2. Open `http://localhost:5174` in your browser
3. Click **"Sign in with Google"**
4. Complete the Google sign-in flow
5. You should be redirected to the Dashboard

### If you see errors:
- Check browser console (F12)
- Verify Firebase config is correct
- Ensure Google Sign-in is enabled in Firebase Console

---

## Step 7: Seed Sample Decks

After signing in successfully:

1. Open browser console (Press F12)
2. Copy and paste this command:

```javascript
// Import the seeding function
import { seedSampleDecks } from './src/utils/seedDecks.js';

// Run the seeding function
seedSampleDecks();
```

Or use the simpler version if exported to window:

```javascript
seedSampleDecks();
```

3. You should see console messages:
   ```
   🌱 Starting to seed decks...
   ✅ Seeded deck: React Basics (5 cards)
   ✅ Seeded deck: JavaScript Fundamentals (5 cards)
   ✅ Seeded deck: Firebase Basics (5 cards)
   🎉 All decks seeded successfully!
   📚 Total: 3 decks
   ```

4. Refresh the Dashboard - you should see 3 decks!

---

## Step 8: Verify Everything Works

### Test Checklist:

- [ ] Can sign in with Google
- [ ] Dashboard shows 3 decks
- [ ] Can click "Study Now" on a deck
- [ ] Flashcard appears with question
- [ ] Can flip card to see answer
- [ ] Can rate answer (Again/Hard/Good/Easy)
- [ ] Card progresses to next card
- [ ] Session completes when all cards reviewed

---

## 🔒 Security Rules (For Production)

Before deploying to production, update Firestore Security Rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Decks collection - anyone can read, only admins can write
    match /decks/{deckId} {
      allow read: if true;
      allow write: if false; // Or add admin check here
    }
    
    // User progress - users can only access their own progress
    match /user_progress/{progressId} {
      allow read, write: if request.auth != null && 
        progressId.matches(request.auth.uid + '_.*');
    }
  }
}
```

3. Click **"Publish"**

---

## 🚨 Common Issues & Solutions

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution:** 
1. Go to Authentication → Settings → Authorized domains
2. Add your domain (e.g., `localhost` or your production URL)

### Issue: "Missing or insufficient permissions"
**Solution:** 
1. Check Firestore Rules are set to "Test Mode"
2. Verify you're signed in
3. Check browser console for specific error details

### Issue: "No decks appearing on Dashboard"
**Solution:**
1. Run the seed script again
2. Check Firestore Database → Data tab to see if decks exist
3. Check browser console for errors

### Issue: Cannot sign in
**Solution:**
1. Verify Google Sign-in is enabled in Authentication
2. Check firebaseConfig is correctly set
3. Clear browser cache and try again

---

## 📚 Database Structure

After seeding, your Firestore should look like this:

```
📁 decks/
  📄 react-basics
  📄 javascript-fundamentals
  📄 firebase-basics

📁 users/
  📄 {your-user-id}

📁 user_progress/
  📄 {your-user-id}_react-basics
  📄 {your-user-id}_javascript-fundamentals
  📄 {your-user-id}_firebase-basics
```

---

## ✅ Next Steps

After setup is complete:

1. **Study some cards** to test the spaced repetition algorithm
2. **Customize** the sample decks or create new ones
3. **Deploy** to Vercel or Firebase Hosting
4. **Update** security rules for production
5. **Share** with friends to help them learn!

---

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify all Firebase services are enabled
3. Ensure firebaseConfig is correct
4. Review the SETUP_GUIDE.md for additional info

---

## 🎉 You're All Set!

Once Firebase is configured and sample decks are seeded, you're ready to start learning with Gnosis!

**Happy Learning! 🧠✨**
