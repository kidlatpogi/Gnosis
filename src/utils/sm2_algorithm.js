/**
 * Modified SM-2 Algorithm with Anki-style Learning Steps
 * 
 * Learning States:
 * - 'new': Card never seen before
 * - 'learning': Short-term repetition (minutes/hours)
 * - 'review': Long-term repetition (days+)
 * 
 * @param {number} quality - Performance rating (1-5)
 *   1: Wrong - Review in 1 minute
 *   2: Hard/Hint - Review in 10 minutes  
 *   3: Good - Graduate to review or next day
 *   4: Easy - Longer interval
 *   5: Perfect - Even longer interval
 * 
 * @param {Object} cardState - Current card state
 * @param {string} cardState.learningState - 'new', 'learning', or 'review'
 * @param {number} cardState.interval - Current interval (in minutes for learning, days for review)
 * @param {number} cardState.easeFactor - Ease factor (default: 2.5)
 * 
 * @returns {Object} { learningState, interval, easeFactor, nextReview }
 */
export function calculateNextReview(quality, cardState = {}) {
  // Validate input
  if (quality < 1 || quality > 5) {
    throw new Error('Quality must be between 1 and 5');
  }

  const { 
    learningState = 'new', 
    interval = 0, 
    easeFactor = 2.5 
  } = cardState;

  let newState = learningState;
  let newInterval;
  let newEaseFactor = easeFactor;
  const now = new Date();
  let nextReview;

  // LEARNING STATE (Short-term steps in minutes)
  if (learningState === 'new' || learningState === 'learning') {
    if (quality === 1) {
      // Wrong - Reset to 1 minute
      newState = 'learning';
      newInterval = 1; // 1 minute
      nextReview = new Date(now.getTime() + 1 * 60 * 1000);
    } else if (quality === 2) {
      // Hard/Hint - 10 minutes
      newState = 'learning';
      newInterval = 10; // 10 minutes
      nextReview = new Date(now.getTime() + 10 * 60 * 1000);
    } else {
      // Good (3+) - Graduate to review state (1 day)
      newState = 'review';
      newInterval = 1; // 1 day
      nextReview = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    }
  } 
  // REVIEW STATE (Long-term steps in days)
  else {
    // Calculate new ease factor based on quality
    if (quality >= 3) {
      newEaseFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );
    }

    if (quality === 1) {
      // Wrong - Back to learning state, 1 minute
      newState = 'learning';
      newInterval = 1; // minutes
      nextReview = new Date(now.getTime() + 1 * 60 * 1000);
    } else if (quality === 2) {
      // Hard - Back to learning, 10 minutes
      newState = 'learning';
      newInterval = 10; // minutes
      nextReview = new Date(now.getTime() + 10 * 60 * 1000);
    } else if (quality === 3) {
      // Good - Use ease factor
      newInterval = Math.round(interval * newEaseFactor);
      newInterval = Math.max(newInterval, 1); // At least 1 day
      nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    } else if (quality === 4) {
      // Easy - Longer interval
      newInterval = Math.round(interval * newEaseFactor * 1.3);
      newInterval = Math.max(newInterval, 2);
      nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    } else {
      // Perfect (5) - Much longer interval
      newInterval = Math.round(interval * newEaseFactor * 1.5);
      newInterval = Math.max(newInterval, 4);
      nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    }
  }

  return {
    learningState: newState,
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReview: nextReview.toISOString(),
    nextReviewTimestamp: nextReview.getTime()
  };
}

/**
 * Helper function to determine if a hint was used
 * If a hint was used, cap quality at 2 (Hard)
 * 
 * @param {number} userQuality - User's self-reported quality
 * @param {boolean} hintUsed - Whether user used a hint
 * @returns {number} Adjusted quality rating
 */
export function adjustQualityForHint(userQuality, hintUsed) {
  if (hintUsed) {
    return Math.min(userQuality, 2);
  }
  return userQuality;
}

/**
 * Check if a card is due for review (supports both ISO strings and timestamps)
 * 
 * @param {string|number|Object} nextReview - ISO date string, timestamp, or Firestore Timestamp
 * @returns {boolean} True if card is due for review
 */
export function isCardDue(nextReview) {
  if (!nextReview) return true;
  
  const now = new Date();
  let reviewDate;

  // Handle different input types
  if (typeof nextReview === 'string') {
    reviewDate = new Date(nextReview);
  } else if (typeof nextReview === 'number') {
    reviewDate = new Date(nextReview);
  } else if (nextReview.toDate && typeof nextReview.toDate === 'function') {
    // Firestore Timestamp
    reviewDate = nextReview.toDate();
  } else if (nextReview instanceof Date) {
    reviewDate = nextReview;
  } else {
    return true; // If we can't parse it, assume it's due
  }
  
  return now >= reviewDate;
}

/**
 * Get human-readable time until next review
 * @param {string|number|Date} nextReview - Next review date/time
 * @returns {string} Human-readable string like "in 5 minutes" or "in 2 days"
 */
export function getTimeUntilReview(nextReview) {
  if (!nextReview) return 'now';
  
  const now = new Date();
  const reviewDate = new Date(nextReview);
  const diff = reviewDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'now';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  if (hours < 24) return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  return `in ${days} day${days !== 1 ? 's' : ''}`;
}
