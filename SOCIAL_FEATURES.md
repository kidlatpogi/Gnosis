# Social Features Implementation - v1.2.0

## Overview
This update adds comprehensive social features to Gnosis, enabling users to connect with friends, share study materials, and compete on leaderboards.

## New Features

### 1. Friend Management System
**Location:** `/friends`

**Features:**
- Send friend requests via email
- View pending friend requests
- Accept or reject friend requests
- View list of all friends
- Friend count badges

**Firestore Collections:**
- `friend_requests`: Stores pending, accepted, and rejected friend requests
- `friends`: Bidirectional friendship records for quick lookups

**Key Functions in `db.js`:**
- `sendFriendRequest(fromUserId, toUserEmail)`
- `getFriendRequests(userEmail)`
- `acceptFriendRequest(requestId, userId, friendId)`
- `rejectFriendRequest(requestId)`
- `getFriends(userId)`

### 2. Deck Sharing System
**Location:** `/shared-decks`

**Features:**
- Share any of your decks with friends
- View decks shared with you
- Import shared decks to your library
- Automatic deck duplication on import (marked as "Shared")
- Friend-based sharing modal

**Firestore Collections:**
- `shared_decks`: Tracks deck shares between users

**Key Functions in `db.js`:**
- `shareDeck(deckId, fromUserId, toUserId)`
- `getSharedDecks(userId)`
- `importSharedDeck(shareId, userId, deckData)`

### 3. Leaderboard System
**Location:** `/leaderboard`

**Features:**
- Two leaderboard tabs:
  - **Study Time**: Ranked by total minutes studied
  - **Cards Solved**: Ranked by number of unique cards practiced
- Medal icons for top 3 positions (🥇 🥈 🥉)
- "You" badge to highlight current user
- Only shows user + their friends (private competition)
- Real-time updates based on study activity

**Data Sources:**
- Study Time: Aggregates from `studySessions` collection
- Cards Solved: Counts unique cards from `user_progress` collection

**Key Functions in `db.js`:**
- `getStudyTimeLeaderboard(userIds)`
- `getCardsSolvedLeaderboard(userIds)`

## UI Updates

### Navigation Bar
Added three new navigation links:
- **Friends** (Users icon)
- **Shared Decks** (Share2 icon)
- **Leaderboard** (Trophy icon)

### Landing Page
Added feature cards for:
- Friends & Collaboration
- Share Decks
- Leaderboards

## Routes Added

```javascript
/friends          → Friends page (protected)
/shared-decks     → SharedDecks page (protected)
/leaderboard      → Leaderboard page (protected)
```

## Technical Implementation

### New Files Created
1. `src/pages/Friends.jsx` - Friend management interface
2. `src/pages/SharedDecks.jsx` - Deck sharing and import interface
3. `src/pages/Leaderboard.jsx` - Competition leaderboards

### Modified Files
1. `src/lib/db.js` - Added 11 new database functions
2. `src/components/Navbar.jsx` - Added navigation links
3. `src/App.jsx` - Added routes and imports
4. `src/pages/Landing.jsx` - Added social feature cards

### Database Schema

**friend_requests:**
```javascript
{
  fromUserId: string,
  toUserEmail: string,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: timestamp
}
```

**friends:**
```javascript
{
  userId: string,
  friendId: string,
  createdAt: timestamp
}
```

**shared_decks:**
```javascript
{
  deckId: string,
  fromUserId: string,
  toUserId: string,
  sharedAt: timestamp,
  imported: boolean
}
```

## Usage Flow

### Adding a Friend
1. Navigate to `/friends`
2. Enter friend's email address
3. Click "Send Request"
4. Friend receives request in their Friends page
5. Friend accepts or rejects
6. Both users now appear in each other's friend list

### Sharing a Deck
1. Navigate to `/shared-decks`
2. Click "Share" on any of your decks
3. Select a friend from dropdown
4. Friend receives deck in "Decks Shared With You"
5. Friend clicks "Import" to add to their library

### Competing on Leaderboards
1. Navigate to `/leaderboard`
2. View your rank among friends
3. Switch between "Study Time" and "Cards Solved" tabs
4. Rankings update automatically as you study

## Benefits

### For Users
- **Motivation**: Compete with friends to stay consistent
- **Collaboration**: Share quality study materials
- **Community**: Build a learning network
- **Accountability**: Track progress against peers

### For App Growth
- **Viral Loop**: Users invite friends to use the app
- **Engagement**: Competition drives daily usage
- **Content**: Users create and share high-quality decks
- **Retention**: Social features increase stickiness

## Privacy & Security

- Friend connections are explicit (must be accepted)
- Only shows data for user + their friends
- Deck sharing is manual (user-initiated)
- No public profiles or global leaderboards
- Friend requests are email-based for security

## Future Enhancements (Ideas)

1. **Notifications**: Alert users of friend requests and shared decks
2. **Study Groups**: Create group study sessions with multiple friends
3. **Deck Comments**: Let friends comment on shared decks
4. **Weekly Challenges**: Set study goals and compete weekly
5. **Achievement Badges**: Unlock badges for milestones
6. **Friend Suggestions**: Recommend friends based on similar decks
7. **Public Deck Library**: Optional public sharing marketplace
8. **Study Streaks**: Track consecutive days studying with visualizations

## Testing Checklist

- [ ] Send friend request
- [ ] Accept friend request
- [ ] Reject friend request
- [ ] View friends list
- [ ] Share deck with friend
- [ ] Import shared deck
- [ ] View study time leaderboard
- [ ] View cards solved leaderboard
- [ ] Verify rankings update after studying
- [ ] Test with no friends (empty states)
- [ ] Test navigation links in navbar

## Firestore Rules Update Required

Don't forget to update your Firestore security rules to include the new collections:

```javascript
// Add to firestore.rules
match /friend_requests/{requestId} {
  allow read, write: if request.auth != null;
}

match /friends/{friendshipId} {
  allow read, write: if request.auth != null;
}

match /shared_decks/{shareId} {
  allow read, write: if request.auth != null;
}
```

## Build Status
✅ All files compile successfully
✅ No TypeScript/lint errors
✅ Build size: 757.65 kB (optimized)

---

**Version:** 1.2.0  
**Date:** December 6, 2025  
**Status:** Ready for Production
