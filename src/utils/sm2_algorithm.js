/**
 * Modified SM-2 Algorithm with Binary Correct/Incorrect System
 * 
 * Learning States:
 * - 'new': Card never seen before
 * - 'learning': Short-term repetition (minutes/hours)
 * - 'review': Long-term repetition (days+)
 * 
 * @param {number} quality - Performance rating (1-2 only)
 *   1: Incorrect - Review in 1 minute
 *   2: Correct - Advance to next interval
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
      // Incorrect - Reset to 1 minute
      newState = 'learning';
      newInterval = 1; // 1 minute
      nextReview = new Date(now.getTime() + 1 * 60 * 1000);
    } else {
      // Correct - Graduate to review state (1 day)
      newState = 'review';
      newInterval = 1; // 1 day
      nextReview = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    }
  }
  // REVIEW STATE (Long-term steps in days)
  else {
    if (quality === 1) {
      // Incorrect - Back to learning state, 1 minute
      newState = 'learning';
      newInterval = 1; // minutes
      nextReview = new Date(now.getTime() + 1 * 60 * 1000);
    } else {
      // Correct - Increase interval by ease factor
      newEaseFactor = Math.max(
        1.3,
        easeFactor + 0.1 // Increase ease factor each successful review
      );

      // Validate interval before calculation
      let safeInterval = isNaN(interval) || interval === null || interval === undefined ? 1 : interval;

      // Cap unreasonably large intervals (max 365 days = 1 year)
      if (safeInterval > 365) {
        console.warn('Interval too large, resetting:', safeInterval);
        safeInterval = 1;
      }

      const safeEaseFactor = isNaN(newEaseFactor) || newEaseFactor === null ? 2.5 : newEaseFactor;

      newInterval = Math.round(safeInterval * safeEaseFactor);
      newInterval = Math.max(newInterval, 1); // At least 1 day
      newInterval = Math.min(newInterval, 365); // Cap at 365 days

      // Validate newInterval before creating date
      if (isNaN(newInterval) || !isFinite(newInterval)) {
        console.error('Invalid interval calculation:', { interval, easeFactor, newInterval });
        newInterval = 1;
      }

      nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    }
  }

  // Validate nextReview before converting to ISO string
  if (!nextReview || isNaN(nextReview.getTime())) {
    console.error('Invalid nextReview date, using default (1 day from now)', {
      learningState,
      interval,
      easeFactor,
      newInterval,
      nextReview
    });
    nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
 * In binary system, hints don't cap quality - user still rates Correct/Incorrect
 * 
 * @param {number} userQuality - User's self-reported quality (1 or 2)
 * @param {boolean} hintUsed - Whether user used a hint (noted but doesn't affect rating)
 * @returns {number} Quality rating (1 or 2)
 */
export function adjustQualityForHint(userQuality, hintUsed) {
  // In binary system, hints don't change quality rating
  // Just return the user's choice (1=Incorrect, 2=Correct)
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
