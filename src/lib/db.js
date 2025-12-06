// Firestore Database Helper Functions
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new deck in Firestore
 * @param {string} userId - The ID of the user creating the deck
 * @param {Object} deckData - Deck data object
 * @param {string} deckData.title - Deck title
 * @param {string} deckData.subject - Deck subject/category
 * @param {Array} deckData.cards - Array of card objects with {id, front, back}
 * @returns {Promise<string>} - The created deck ID
 */
export async function createDeck(userId, deckData) {
  try {
    // Validate input
    if (!deckData.title || deckData.title.trim() === '') {
      throw new Error('Deck title is required');
    }
    
    // Cards can be empty initially - they will be added in the next step

    // Generate a unique deck ID
    const deckId = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create deck document
    const deckRef = doc(db, 'decks', deckId);
    const newDeck = {
      title: deckData.title.trim(),
      subject: deckData.subject?.trim() || 'General',
      cards: deckData.cards || [], // Allow empty cards array
      createdAt: serverTimestamp(),
      creatorId: userId,
      isPublic: true // Default to public
    };
    
    await setDoc(deckRef, newDeck);
    
    console.log('✅ Deck created successfully:', deckId);
    return deckId;
  } catch (error) {
    console.error('❌ Error creating deck:', error);
    throw error;
  }
}

/**
 * Update an existing deck in Firestore
 * @param {string} deckId - The deck ID to update
 * @param {Object} data - Updated deck data (title, subject, cards, etc.)
 * @returns {Promise<void>}
 */
export async function updateDeck(deckId, data) {
  try {
    // Validate input
    if (!deckId) {
      throw new Error('Deck ID is required');
    }

    if (data.title && data.title.trim() === '') {
      throw new Error('Deck title cannot be empty');
    }

    if (data.cards && data.cards.length === 0) {
      throw new Error('Deck must have at least one card');
    }

    const deckRef = doc(db, 'decks', deckId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    // Clean up data (remove undefined fields)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(deckRef, updateData);
    
    console.log('✅ Deck updated successfully:', deckId);
  } catch (error) {
    console.error('❌ Error updating deck:', error);
    throw error;
  }
}

/**
 * Get all decks from Firestore
 * @returns {Promise<Array>} - Array of deck objects with IDs
 */
export async function getAllDecks() {
  try {
    const decksRef = collection(db, 'decks');
    const q = query(decksRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const decks = [];
    querySnapshot.forEach((doc) => {
      decks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📚 Fetched ${decks.length} decks`);
    
    // If no decks found, return empty array (not an error)
    if (decks.length === 0) {
      console.log('ℹ️ No decks found in database. Database might be empty.');
    }
    
    return decks;
  } catch (error) {
    console.error('❌ Error fetching decks:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Specific error handling
    if (error.code === 'permission-denied') {
      alert('Firestore Permission Error: Check your Rules in Firebase Console.\n\nMake sure you have enabled Firestore and set up proper security rules.');
    } else if (error.code === 'unavailable') {
      alert('Network Error: Check your internet connection and try again.');
    }
    
    throw error;
  }
}

/**
 * Get a specific deck by ID
 * @param {string} deckId - The deck ID
 * @returns {Promise<Object>} - Deck object with ID
 */
export async function getDeck(deckId) {
  try {
    const deckRef = doc(db, 'decks', deckId);
    const deckSnap = await getDoc(deckRef);
    
    if (!deckSnap.exists()) {
      throw new Error('Deck not found');
    }
    
    return {
      id: deckSnap.id,
      ...deckSnap.data()
    };
  } catch (error) {
    console.error('❌ Error fetching deck:', error);
    throw error;
  }
}

/**
 * Get user's progress for a specific deck
 * @param {string} userId - The user ID
 * @param {string} deckId - The deck ID
 * @returns {Promise<Object|null>} - Progress object or null if not exists
 */
export async function getUserProgress(userId, deckId) {
  try {
    const progressRef = doc(db, 'user_progress', `${userId}_${deckId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) {
      return null;
    }
    
    return progressSnap.data();
  } catch (error) {
    console.error('❌ Error fetching user progress:', error);
    throw error;
  }
}

/**
 * Update user's progress for a specific card
 * @param {string} userId - The user ID
 * @param {string} deckId - The deck ID
 * @param {string} cardId - The card ID
 * @param {Object} progressData - Progress data {interval, easeFactor, nextReviewDate, etc.}
 * @returns {Promise<void>}
 */
export async function updateCardProgress(userId, deckId, cardId, progressData) {
  try {
    const progressRef = doc(db, 'user_progress', `${userId}_${deckId}`);
    const progressSnap = await getDoc(progressRef);
    
    const currentProgress = progressSnap.exists() ? progressSnap.data() : { cards: {} };
    
    // Update the specific card's progress
    const updatedProgress = {
      ...currentProgress,
      cards: {
        ...currentProgress.cards,
        [cardId]: {
          ...progressData,
          lastReviewed: serverTimestamp()
        }
      }
    };
    
    await setDoc(progressRef, updatedProgress);
    console.log('✅ Card progress updated');
  } catch (error) {
    console.error('❌ Error updating card progress:', error);
    throw error;
  }
}

/**
 * Seed the database with a sample deck
 * Useful for testing and initial setup
 * @returns {Promise<void>}
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    const sampleDeck = {
      title: "Welcome to Gnosis",
      subject: "Tutorial",
      cards: [
        { 
          id: "welcome_1", 
          front: "What is Gnosis?", 
          back: "A smart flashcard app that uses spaced repetition to help you master any subject effectively." 
        },
        {
          id: "welcome_2",
          front: "How does spaced repetition work?",
          back: "It schedules review sessions at optimal intervals based on how well you know each card, maximizing retention."
        },
        {
          id: "welcome_3",
          front: "What are the rating options?",
          back: "Again (forgot), Hard (difficult), Good (remembered with effort), and Easy (perfect recall)."
        }
      ],
      createdAt: serverTimestamp(),
      creatorId: 'system',
      isPublic: true
    };
    
    const deckId = 'welcome_tutorial';
    const deckRef = doc(db, 'decks', deckId);
    await setDoc(deckRef, sampleDeck);
    
    console.log('✅ Database seeded!');
    console.log('Created sample deck:', sampleDeck.title);
    alert('Database seeded successfully! Refresh the page to see the sample deck.');
    
    return deckId;
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      alert('Permission Error: Cannot seed database. Check your Firestore Rules in Firebase Console.');
    } else {
      alert(`Error seeding database: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Delete a deck from Firestore
 * @param {string} deckId - The ID of the deck to delete
 * @returns {Promise<void>}
 */
export async function deleteDeck(deckId) {
  try {
    if (!deckId) {
      throw new Error('Deck ID is required');
    }

    const deckRef = doc(db, 'decks', deckId);
    await deleteDoc(deckRef);
    
    console.log('✅ Deck deleted successfully:', deckId);
  } catch (error) {
    console.error('❌ Error deleting deck:', error);
    throw error;
  }
}

// ==================== FRIEND MANAGEMENT ====================

/**
 * Look up a user by their unique 6-digit code
 * @param {string} userCode - The user's 6-digit code
 * @returns {Promise<Object|null>} - User object with uid or null if not found
 */
export async function getUserByCode(userCode) {
  try {
    if (!userCode) {
      throw new Error('User code is required');
    }
    
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    let foundUser = null;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userCode && data.userCode === userCode) {
        foundUser = {
          uid: docSnap.id,
          ...data
        };
      }
    });
    
    if (!foundUser) {
      throw new Error(`User with code "${userCode}" not found`);
    }
    
    console.log('✅ User found:', foundUser.uid);
    return foundUser;
  } catch (error) {
    console.error('❌ Error looking up user by code:', error);
    throw error;
  }
}

/**
 * Send a friend request
 * @param {string} fromUserId - The ID of the user sending the request
 * @param {string} fromUserCode - The 6-digit code of the user sending the request
 * @param {string} toUserCode - The 6-digit code of the user to add as friend
 * @returns {Promise<void>}
 */
export async function sendFriendRequest(fromUserId, fromUserCode, toUserCode) {
  try {
    // Look up the recipient to get their UID
    const recipientUser = await getUserByCode(toUserCode);
    
    const requestId = `${fromUserId}_${recipientUser.uid}_${Date.now()}`;
    const requestRef = doc(db, 'friend_requests', requestId);
    
    const requestData = {
      fromUserId,
      fromUserCode,
      toUserId: recipientUser.uid,
      toUserCode,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    
    console.log('📤 Sending friend request:', requestData);
    
    await setDoc(requestRef, requestData);
    
    console.log('✅ Friend request sent successfully to', recipientUser.uid);
  } catch (error) {
    console.error('❌ Error sending friend request:', error);
    throw error;
  }
}

/**
 * Get pending friend requests for a user
 * @param {string} userEmail - The email of the user
 * @returns {Promise<Array>} - Array of friend request objects
 */
export async function getFriendRequests(userEmail) {
  try {
    const requestsRef = collection(db, 'friend_requests');
    const querySnapshot = await getDocs(requestsRef);
    
    const requests = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.toUserEmail === userEmail && data.status === 'pending') {
        requests.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return requests;
  } catch (error) {
    console.error('❌ Error fetching friend requests:', error);
    throw error;
  }
}

/**
 * Accept a friend request
 * @param {string} requestId - The friend request ID
 * @param {string} userId - The ID of the user accepting
 * @param {string} friendId - The ID of the friend
 * @returns {Promise<void>}
 */
export async function acceptFriendRequest(requestId, userId, friendId) {
  try {
    // First verify the request exists
    const requestRef = doc(db, 'friend_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Friend request not found');
    }
    
    // Update request status
    await updateDoc(requestRef, { 
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });
    
    // Create friendship documents (bidirectional)
    const friendship1Id = `${userId}_${friendId}`;
    const friendship2Id = `${friendId}_${userId}`;
    
    // Use batch or Promise.all for atomic operations
    await Promise.all([
      setDoc(doc(db, 'friends', friendship1Id), {
        userId,
        friendId,
        createdAt: serverTimestamp()
      }),
      setDoc(doc(db, 'friends', friendship2Id), {
        userId: friendId,
        friendId: userId,
        createdAt: serverTimestamp()
      })
    ]);
    
    console.log('✅ Friend request accepted');
  } catch (error) {
    console.error('❌ Error accepting friend request:', error);
    console.error('Request ID:', requestId);
    console.error('User ID:', userId);
    console.error('Friend ID:', friendId);
    throw error;
  }
}

/**
 * Reject a friend request
 * @param {string} requestId - The friend request ID
 * @returns {Promise<void>}
 */
export async function rejectFriendRequest(requestId) {
  try {
    const requestRef = doc(db, 'friend_requests', requestId);
    
    // Verify request exists
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      throw new Error('Friend request not found');
    }
    
    await updateDoc(requestRef, { 
      status: 'rejected',
      rejectedAt: serverTimestamp()
    });
    
    console.log('✅ Friend request rejected');
  } catch (error) {
    console.error('❌ Error rejecting friend request:', error);
    console.error('Request ID:', requestId);
    throw error;
  }
}

/**
 * Get all friends for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of friend user IDs
 */
export async function getFriends(userId) {
  try {
    if (!userId) {
      console.error('❌ getFriends: Missing userId');
      return [];
    }
    
    const friendsRef = collection(db, 'friends');
    const querySnapshot = await getDocs(friendsRef);
    
    const friends = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Filter client-side to avoid index requirement
      if (data.userId === userId && data.friendId) {
        friends.push(data.friendId);
      }
    });
    
    console.log(`✅ Found ${friends.length} friends for user ${userId}`);
    return friends;
  } catch (error) {
    console.error('❌ Error fetching friends:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Listen to friend requests in real-time
 * @param {string} userId - The UID of the user
 * @param {Function} callback - Callback function with friend requests array
 * @returns {Function} - Unsubscribe function
 */
export function listenToFriendRequests(userId, callback) {
  // Validate parameters
  if (!userId || !callback) {
    console.error('❌ listenToFriendRequests: Missing required parameters');
    return () => {}; // Return empty unsubscribe function
  }
  
  console.log('🔄 Setting up friend requests listener for user:', userId);
  
  try {
    // Use simple collection query and filter client-side to avoid composite index
    const requestsRef = collection(db, 'friend_requests');
    
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      console.log('📬 Friend requests snapshot received, total docs:', snapshot.size);
      const requests = [];
      const allRequests = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allRequests.push({ id: docSnap.id, ...data });
        
        // Filter client-side for this user's pending requests
        if (data.toUserId === userId && data.status === 'pending') {
          console.log('✅ Matching request found:', { id: docSnap.id, from: data.fromUserCode, to: data.toUserCode });
          requests.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      
      console.log('📊 All requests:', allRequests);
      console.log(`📨 Found ${requests.length} pending friend requests for user ${userId}`);
      callback(requests);
    }, (error) => {
      console.error('❌ Error listening to friend requests:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up friend requests listener:', error);
    return () => {};
  }
}

/**
 * Listen to friends list in real-time
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function with friends array
 * @returns {Function} - Unsubscribe function
 */
export function listenToFriends(userId, callback) {
  // Validate parameters
  if (!userId || !callback) {
    console.error('❌ listenToFriends: Missing required parameters');
    return () => {}; // Return empty unsubscribe function
  }
  
  try {
    // Use simple collection query and filter client-side to avoid index requirement
    const friendsRef = collection(db, 'friends');
    
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friends = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Filter client-side for this user's friends
        if (data.userId === userId && data.friendId) {
          friends.push(data.friendId);
        }
      });
      console.log(`👥 Found ${friends.length} friends`);
      callback(friends);
    }, (error) => {
      console.error('❌ Error listening to friends:', error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up friends listener:', error);
    return () => {};
  }
}

// ==================== DECK SHARING ====================

/**
 * Share a deck with a friend
 * @param {string} deckId - The deck ID to share
 * @param {string} fromUserId - The ID of the user sharing
 * @param {string} toUserId - The ID of the friend receiving
 * @returns {Promise<void>}
 */
export async function shareDeck(deckId, fromUserId, toUserId) {
  try {
    const shareId = `${deckId}_${fromUserId}_${toUserId}_${Date.now()}`;
    const shareRef = doc(db, 'shared_decks', shareId);
    
    await setDoc(shareRef, {
      deckId,
      fromUserId,
      toUserId,
      sharedAt: serverTimestamp(),
      imported: false
    });
    
    console.log('✅ Deck shared successfully');
  } catch (error) {
    console.error('❌ Error sharing deck:', error);
    throw error;
  }
}

/**
 * Get decks shared with a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of shared deck objects
 */
export async function getSharedDecks(userId) {
  try {
    const sharesRef = collection(db, 'shared_decks');
    const querySnapshot = await getDocs(sharesRef);
    
    const shares = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.toUserId === userId && !data.imported) {
        shares.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Fetch deck details for each share
    const sharedDecks = await Promise.all(
      shares.map(async (share) => {
        const deck = await getDeck(share.deckId);
        return {
          ...share,
          deck
        };
      })
    );
    
    return sharedDecks;
  } catch (error) {
    console.error('❌ Error fetching shared decks:', error);
    throw error;
  }
}

/**
 * Import a shared deck to user's library
 * @param {string} shareId - The share ID
 * @param {string} userId - The user ID importing
 * @param {Object} deckData - The deck data to import
 * @returns {Promise<string>} - The new deck ID
 */
export async function importSharedDeck(shareId, userId, deckData) {
  try {
    // Create a copy of the deck for the user
    const newDeckId = await createDeck(userId, {
      title: deckData.title + ' (Shared)',
      subject: deckData.subject,
      cards: deckData.cards
    });
    
    // Mark the share as imported
    const shareRef = doc(db, 'shared_decks', shareId);
    await updateDoc(shareRef, { imported: true });
    
    console.log('✅ Deck imported successfully');
    return newDeckId;
  } catch (error) {
    console.error('❌ Error importing deck:', error);
    throw error;
  }
}

/**
 * Listen to shared decks in real-time
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function with shared decks array
 * @returns {Function} - Unsubscribe function
 */
export function listenToSharedDecks(userId, callback) {
  if (!userId || !callback) {
    console.error('❌ listenToSharedDecks: Missing required parameters');
    return () => {};
  }
  
  try {
    // Use simple collection query and filter client-side to avoid composite index
    const sharesRef = collection(db, 'shared_decks');
    
    const unsubscribe = onSnapshot(sharesRef, async (snapshot) => {
      const shares = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Filter client-side for this user's unimported shares
        if (data.toUserId === userId && data.imported === false) {
          shares.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      
      console.log(`📦 Found ${shares.length} shared decks`);
      
      // Fetch deck details for each share
      const sharedDecks = await Promise.all(
        shares.map(async (share) => {
          try {
            const deck = await getDeck(share.deckId);
            return {
              ...share,
              deck
            };
          } catch (error) {
            console.error(`Error fetching deck ${share.deckId}:`, error);
            return null;
          }
        })
      );
      
      callback(sharedDecks.filter(Boolean));
    }, (error) => {
      console.error('❌ Error listening to shared decks:', error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up shared decks listener:', error);
    return () => {};
  }
}

// ==================== LEADERBOARD ====================

/**
 * Get leaderboard data for study time among friends
 * @param {Array<string>} userIds - Array of user IDs to include (user + friends)
 * @returns {Promise<Array>} - Sorted array of {userId, totalMinutes}
 */
export async function getStudyTimeLeaderboard(userIds) {
  try {
    const sessionsRef = collection(db, 'studySessions');
    const querySnapshot = await getDocs(sessionsRef);
    
    const userStats = {};
    userIds.forEach(id => {
      userStats[id] = 0;
    });
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (userIds.includes(data.userId)) {
        userStats[data.userId] += data.duration || 0;
      }
    });
    
    // Convert to array and sort
    const leaderboard = Object.entries(userStats)
      .map(([userId, totalMinutes]) => ({ userId, totalMinutes }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    return leaderboard;
  } catch (error) {
    console.error('❌ Error fetching study time leaderboard:', error);
    throw error;
  }
}

/**
 * Get leaderboard data for cards solved among friends
 * @param {Array<string>} userIds - Array of user IDs to include (user + friends)
 * @returns {Promise<Array>} - Sorted array of {userId, totalCards}
 */
export async function getCardsSolvedLeaderboard(userIds) {
  try {
    const progressRef = collection(db, 'user_progress');
    const querySnapshot = await getDocs(progressRef);
    
    const userStats = {};
    userIds.forEach(id => {
      userStats[id] = 0;
    });
    
    querySnapshot.forEach((doc) => {
      const progressId = doc.id;
      const userId = progressId.split('_')[0];
      
      if (userIds.includes(userId)) {
        const data = doc.data();
        const cards = data.cards || {};
        userStats[userId] += Object.keys(cards).length;
      }
    });
    
    // Convert to array and sort
    const leaderboard = Object.entries(userStats)
      .map(([userId, totalCards]) => ({ userId, totalCards }))
      .sort((a, b) => b.totalCards - a.totalCards);
    
    return leaderboard;
  } catch (error) {
    console.error('❌ Error fetching cards solved leaderboard:', error);
    throw error;
  }
}
