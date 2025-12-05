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
