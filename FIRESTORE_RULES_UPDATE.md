# Firestore Security Rules Update Required

## QUICK FIX - Do This Now!

⚠️ **Your app needs Firestore rules updated to save study sessions**

### Fast Steps:
1. Go to: https://console.firebase.google.com → Select **Gnosis** project
2. Click **Firestore Database** → **Rules** tab
3. **Clear everything** and paste the rules from **Step 2** below
4. Click **Publish**
5. Wait 5-10 seconds for "Rules updated" confirmation
6. **Refresh app** (Ctrl+Shift+R)
7. Done! ✅

---

## Problem
The app cannot save session state because Firestore rules don't allow access to `study_session_states` collection.

**Error**: `FirebaseError: Missing or insufficient permissions`

## Solution

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your **Gnosis** project
3. Go to **Firestore Database** → **Rules** tab

### Step 2: Replace ALL Rules with This

Copy and paste the complete rules below (replace everything):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Decks collection
    match /decks/{deckId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.creatorId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.creatorId == request.auth.uid;
    }
    
    // User progress collection - Allow read for all authenticated users (needed for leaderboards)
    match /user_progress/{progressId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && progressId.matches('^' + request.auth.uid + '_.*');
    }
    
    // Study sessions collection - Allow read for all authenticated users (needed for leaderboards)
    match /studySessions/{sessionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Friend requests collection - CRITICAL: Must allow read for all authenticated users
    match /friend_requests/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.fromUserId == request.auth.uid;
      allow update, delete: if isAuthenticated() && (
        resource.data.toUserId == request.auth.uid ||
        resource.data.fromUserId == request.auth.uid
      );
    }
    
    // Friends collection - CRITICAL: Must allow read for all authenticated users
    match /friends/{friendshipId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (
        request.resource.data.userId == request.auth.uid ||
        request.resource.data.friendId == request.auth.uid
      );
      allow delete: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        resource.data.friendId == request.auth.uid
      );
    }
    
    // Shared decks collection
    match /shared_decks/{shareId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.fromUserId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.toUserId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.fromUserId == request.auth.uid;
    }
    
    // Study session states collection - For resumable study sessions
    match /study_session_states/{sessionStateId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 3: Publish
1. Click the **Publish** button in Firebase Console
2. Wait for confirmation (1-2 seconds)
3. You should see: ✅ "Rules updated"

### Step 4: Test
1. Refresh your app (Ctrl+F5 or Cmd+Shift+R)
2. Study some cards and stop at card 14
3. Return to Dashboard
4. You should see **"Continue" button** (not "Review")
5. Click "Continue" to resume from card 14

## What Each Rule Does

| Collection | Permission | Purpose |
|---|---|---|
| `users` | Users read/write own | User profile data |
| `decks` | Auth users read, creator write | Deck creation and access |
| `user_progress` | Auth users read, write own | Track card ratings |
| `studySessions` | Auth users read/write own | Study time tracking and leaderboards |
| `study_session_states` | Auth users read/write own | **Resume functionality** ⭐ |
| `friend_requests` | Auth users read, both parties update | Friend requests |
| `friends` | Auth users read/write | Friend list |
| `shared_decks` | Auth users read/write shared | Shared decks |

## Key Security Rules

✅ **`study_session_states`** - Each user can ONLY read/write their own sessions
- `allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;`
- `allow create/update/delete: if isAuthenticated() && resource.data.userId == request.auth.uid;`

✅ **Helper Functions** - Clean, reusable security logic
- `isAuthenticated()` - All authenticated users
- `isOwner(userId)` - Only the user who owns the resource

## Troubleshooting

### ❌ Getting `net::ERR_BLOCKED_BY_CLIENT` error?
This means a browser extension (ad blocker, privacy tool) is blocking requests.

**Fix:**
1. **Disable ad blockers temporarily**: 
   - uBlock Origin: Click icon → turn OFF
   - Adblock Plus: Click icon → turn OFF
2. **Refresh the app** (Ctrl+Shift+R)
3. Try saving a study session again
4. Once rules are updated, re-enable your extensions

### ❌ Still getting permission errors?
1. **Hard refresh**: Press `Ctrl+Shift+Delete` → Clear all cache
2. **Logout completely**: Log out and back in
3. **Check Firebase Console**:
   - Go to Rules tab
   - Look for green checkmark "Published"
   - Rules should match the ones in Step 2
4. **Wait 10 seconds**: Rules take time to propagate globally

### ✅ How to verify rules are working:
1. Open Browser DevTools (F12)
2. Go to **Console** tab
3. Study some cards and leave
4. You should see NO errors (or only the extension warnings)
5. Return to Dashboard
6. Button should say **"Continue"** (not "Review")

### ❌ Continue button not showing?
1. Make sure you studied and left before checking
2. Go to Firebase → Firestore → Collections
3. Look for `study_session_states` collection
4. Should have a document like `userId_deckId`
5. If not, the rules need updating

## After Publishing

✅ You should now be able to:
- Study cards and leave without losing progress
- See "Continue" button on Dashboard
- Resume from exact card position
- Keep your progress when resuming

🎉 Session persistence is now fully working!
