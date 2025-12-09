# Session Persistence Implementation

## Overview
Users can now resume their study sessions from where they left off. If a user stops studying at card 14 of 30 and returns later, they will be prompted to continue from card 14 or start fresh.

## Architecture

### Database Storage
- **Collection**: `study_session_states`
- **Document ID**: `${userId}_${deckId}` (compound key)
- **Data Structure**:
  ```javascript
  {
    userId: string,           // Firebase UID
    deckId: string,           // Deck ID
    currentCardIndex: number, // 0-based index (e.g., 13 for card 14)
    currentRound: number,     // Current round (1, 2, etc.)
    cardOrder: string[],      // Array of card IDs in study order
    lastUpdated: string       // ISO timestamp
  }
  ```

### Security Rules
Users can only read/write their own session states:
```javascript
match /study_session_states/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

## Frontend Implementation

### Components Modified

#### `src/lib/db.js`
Three new functions for session management:

1. **`saveStudySessionState(userId, deckId, currentCardIndex, currentRound, dueCards)`**
   - Saves current study position after each card rating
   - Stores card order to preserve randomization
   - Called after every card interaction

2. **`getStudySessionState(userId, deckId)`**
   - Retrieves saved session when study page loads
   - Returns null if no session exists
   - Used to populate resume prompt

3. **`clearStudySessionState(userId, deckId)`**
   - Deletes session state when user completes a round
   - Called in: `handleStartNextRound()`, `handleReviewAgain()`
   - Ensures clean slate for new rounds

#### `src/pages/Study.jsx`
Three new state variables:
- `showResumePrompt`: Boolean to display resume dialog
- `savedSession`: Object containing saved session data

Three new handlers:

1. **`handleResumeSession()`**
   - Restores `currentCardIndex` and `currentRound` from saved session
   - Reorders `dueCards` array based on saved card order
   - Hides prompt and displays StudyCard
   - Maintains user's previous position and context

2. **`handleStartFresh()`**
   - Clears session from Firestore
   - Resets `currentCardIndex` to 0
   - Resets `currentRound` to 1
   - Starts study from beginning

3. **Modified `handleRateCard()`**
   - After incrementing card index, saves session state
   - Uses callback to save asynchronously without blocking UI
   - Ensures position is saved after every card rating

#### Session Loading in `loadData()`
After shuffling cards, checks for saved sessions:
```javascript
const sessionState = await getStudySessionState(user.uid, deckId);
if (sessionState && sessionState.currentCardIndex > 0 && sessionState.currentCardIndex < shuffledCards.length) {
  setSavedSession(sessionState);
  setShowResumePrompt(true);
}
```

#### Resume Prompt UI
Modal dialog with:
- Title: "Continue Previous Session?"
- Message: "You were studying this deck. Continue from card X of Y?"
- Two buttons: "Start Fresh" and "Resume"
- Styled with Bootstrap glass card effect
- Shows before StudyCard renders

#### Session Cleanup
Sessions are cleared when:
1. User starts a new round (`handleStartNextRound()`)
2. User reviews all cards again (`handleReviewAgain()`)
3. User completes a round (implicitly, as new round clears old state)

## Usage Flow

### User Scenario
1. User starts studying 30-card deck
2. Studies cards 1-14, then closes app/navigates away
3. Session saved to Firestore: `{currentCardIndex: 13, currentRound: 1, cardOrder: [...]}`
4. User returns and clicks "Review" on same deck
5. Study page loads, detects saved session
6. Resume prompt appears: "Continue from card 14?"
7. **Option A**: Click "Resume" → jumps to card 14, continues from there
8. **Option B**: Click "Start Fresh" → session cleared, starts from card 1
9. After each card, new position is saved (card 15, 16, etc.)
10. When round completes, session is cleared for clean next round

### Save Frequency
- **After each card**: Position saved to enable seamless resume
- **On page unload**: Study session metadata saved (time, cards studied)
- **On next round**: Previous session cleared to prevent confusion

## Technical Details

### Why Card Order is Stored
Cards are shuffled for randomization on each study session. To maintain consistency:
- Original shuffle order is stored in `cardOrder` array
- When resuming, cards are reordered to match saved order
- User sees cards in same sequence they were studying

### Why currentCardIndex is 0-based
- JavaScript arrays are 0-indexed
- `currentCardIndex: 13` means studying the 14th card (13 + 1)
- UI displays as "Card 14" using `currentIndex + 1`
- Firestore stores 0-based for consistency with code

### Session State Persistence
Sessions persist in Firestore until explicitly cleared:
- Survives browser refresh
- Survives browser close and reopen
- Survives app deployment
- Cleared only when: new round started, review all started, or explicit "Start Fresh"

### Performance Considerations
- Session save is async but non-blocking (fire-and-forget with catch)
- Does not impact card rating or study flow
- Firestore document is small (< 1KB per session)
- No significant performance impact

## Testing Checklist

### Resume Functionality
- [ ] Start studying 30-card deck
- [ ] Study cards, stop at card 14
- [ ] Close browser or navigate away
- [ ] Return to app and click Review on same deck
- [ ] Resume prompt appears
- [ ] Click "Resume" → shows card 14
- [ ] Card counter shows "14/30"
- [ ] Continue studying → position keeps updating

### Start Fresh Functionality
- [ ] With resume prompt showing
- [ ] Click "Start Fresh"
- [ ] Deck resets to card 1
- [ ] Card counter shows "1/30"
- [ ] No session saved in Firestore

### Round Completion
- [ ] Complete a study round
- [ ] Start next round (cards to retry)
- [ ] Previous session cleared
- [ ] New round starts fresh with retry cards

### Data Integrity
- [ ] Session shows correct card count
- [ ] Card order matches what user was studying
- [ ] Round number is preserved
- [ ] No duplicate sessions in Firestore

## Future Enhancements
- [ ] Add "Resume" quick action on dashboard deck card
- [ ] Show "Last studied: X minutes ago" in resume prompt
- [ ] Track session history (how many times resumed, etc.)
- [ ] Auto-resume instead of prompting (user preference)
- [ ] Multi-device sync (resume on different device)
- [ ] Session timeline (jump to specific position via timeline)

## Known Limitations
- Session only persists for one user per deck (not shared)
- Resuming after major deck edits (card added/removed) may show stale card indices
- If user is offline, saves may queue and cause race conditions
- No encryption of session data (standard Firestore security)

## Debugging

### Check Saved Sessions
Firestore collection path: `study_session_states/userId_deckId`

Example:
```
study_session_states/
├── user123_deck456
│   ├── userId: "user123"
│   ├── deckId: "deck456"
│   ├── currentCardIndex: 13
│   ├── currentRound: 1
│   └── cardOrder: ["card1", "card2", ..., "card30"]
```

### Common Issues
1. **Resume prompt not appearing**: Check that `currentCardIndex > 0` and session exists
2. **Wrong card showing**: Verify `cardOrder` array is properly saved and matches dueCards
3. **Session not saving**: Check Firestore security rules allow writes
4. **Session not clearing**: Verify `clearStudySessionState()` is called in all round completion paths

## References
- Session persistence functions: `src/lib/db.js` (lines 837-880)
- Study component implementation: `src/pages/Study.jsx`
- Session state variables: lines 27-28
- Session loading: lines 116-126
- Resume handlers: lines 361-391
- Resume UI: lines 498-510
- Session save on card: lines 278-287
- Session clear on next round: line 330
- Session clear on review again: line 398
