import { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import StudyCard from '../components/StudyCard';
import { calculateNextReview, adjustQualityForHint, isCardDue } from '../utils/sm2_algorithm';
import { saveStudySessionState, getStudySessionState, clearStudySessionState } from '../lib/db';
import { ArrowLeft } from 'lucide-react';

const Study = () => {
  const { deckId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [cardsToRetry, setCardsToRetry] = useState([]);
  const [roundStats, setRoundStats] = useState({ correct: 0, incorrect: 0 });
  const [error, setError] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const [cardOrder, setCardOrder] = useState([]); // Track original card order for session persistence

  // Active time tracking with idle detection
  const [activeTimeMs, setActiveTimeMs] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isActive, setIsActive] = useState(true);
  const [currentSegmentStart, setCurrentSegmentStart] = useState(Date.now());
  const [studyMode, setStudyMode] = useState('flashcard');

  const IDLE_TIMEOUT = 120000; // 2 minutes
  const IDLE_CHECK_INTERVAL = 10000; // Check every 10 seconds

  // Record user activity
  const recordActivity = () => {
    const now = Date.now();
    setLastActivityTime(now);
    if (!isActive) {
      setIsActive(true);
      setCurrentSegmentStart(now);
    }
  };

  // Idle detection hook
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;

      if (timeSinceActivity >= IDLE_TIMEOUT && isActive) {
        const segmentDuration = lastActivityTime - currentSegmentStart;
        setActiveTimeMs(prev => prev + segmentDuration);
        setIsActive(false);
      } else if (isActive) {
        const segmentDuration = now - currentSegmentStart;
        setActiveTimeMs(prev => {
          const previousTotal = prev;
          const newTotal = previousTotal - (previousTotal % 1000) + segmentDuration;
          return newTotal;
        });
        setCurrentSegmentStart(now);
      }
    }, IDLE_CHECK_INTERVAL);

    return () => clearInterval(checkIdle);
  }, [lastActivityTime, isActive, currentSegmentStart, IDLE_TIMEOUT, IDLE_CHECK_INTERVAL]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load deck
        const deckRef = doc(db, 'decks', deckId);
        const deckSnap = await getDoc(deckRef);

        if (!deckSnap.exists()) {
          setError('Deck not found');
          return;
        }

        const deckData = { id: deckSnap.id, ...deckSnap.data() };
        setDeck(deckData);

        if (!user) {
          setError('Please log in to study');
          return;
        }

        // Load user progress
        const progressRef = doc(db, 'user_progress', `${user.uid}_${deckId}`);
        const progressSnap = await getDoc(progressRef);

        const userProgress = progressSnap.exists() ? progressSnap.data() : { cards: {} };

        // Check for saved session state FIRST
        const sessionState = await getStudySessionState(user.uid, deckId);
        
        let finalCards;
        let orderedCards;
        
        if (sessionState && sessionState.cardOrder && sessionState.cardOrder.length > 0) {
          // Resume previous session - use the exact cards from the session
          finalCards = deckData.cards.filter(card => sessionState.cardOrder.includes(card.id));
          orderedCards = sessionState.cardOrder
            .map(cardId => finalCards.find(card => card.id === cardId))
            .filter(Boolean);
          setDueCards(orderedCards);
          setCardOrder(orderedCards.map(card => card.id)); // Store the order
          setSavedSession(sessionState);
          setShowResumePrompt(true);
        } else {
          // New session - filter cards that are due for review
          const cardsToReview = deckData.cards.filter(card => {
            const cardProgress = userProgress.cards?.[card.id];
            if (!cardProgress) return true; // New card
            return isCardDue(cardProgress.nextReviewDate);
          });

          // If no cards are due but deck has cards, load all cards for review
          finalCards = cardsToReview.length > 0 ? cardsToReview : deckData.cards;

          // Shuffle cards for randomization (new session)
          const shuffledCards = [...finalCards].sort(() => Math.random() - 0.5);
          setDueCards(shuffledCards);
          setCardOrder(shuffledCards.map(card => card.id)); // Store the order
          setCurrentCardIndex(0);
          setCurrentRound(1);
        }

        // Initialize active time tracking if there are cards
        if (finalCards.length > 0) {
          const now = Date.now();
          setLastActivityTime(now);
          setCurrentSegmentStart(now);
          setIsActive(true);
          setActiveTimeMs(0);
        }
      } catch (err) {
        console.error('Error loading deck:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [deckId, user]);

  // Save study session when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user && deck && activeTimeMs > 0) {
        let finalActiveTime = activeTimeMs;
        if (isActive) {
          const currentSegmentDuration = Date.now() - currentSegmentStart;
          finalActiveTime += currentSegmentDuration;
        }

        if (finalActiveTime >= 1000) { // Only save if at least 1 second
          // Use a synchronous approach for beforeunload
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;

          try {
            // This will be a synchronous save attempt - Firebase may not complete it
            // So we also save on component unmount
            await addDoc(collection(db, 'studySessions'), {
              userId: user.uid,
              deckId: deckId,
              deckTitle: deck.title || 'Unknown Deck',
              date: today,
              duration: finalActiveTime / 1000,
              durationMs: finalActiveTime,
              cardsStudied: currentCardIndex,
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('Error saving session on page unload:', err);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTimeMs, isActive, currentSegmentStart, user, deck, deckId, currentCardIndex]);

  const handleRateCard = async (quality, hintUsed) => {
    // Record user activity
    recordActivity();

    try {
      const currentCard = dueCards[currentCardIndex];

      // Adjust quality if hint was used
      const adjustedQuality = adjustQualityForHint(quality, hintUsed);

      // Get current progress
      const progressRef = doc(db, 'user_progress', `${user.uid}_${deckId}`);
      const progressSnap = await getDoc(progressRef);
      const currentProgress = progressSnap.exists() ? progressSnap.data() : { cards: {} };

      // Get previous card data
      const previousCardData = currentProgress.cards?.[currentCard.id] || {
        learningState: 'new',
        interval: 0,
        easeFactor: 2.5
      };

      // Calculate next review using new algorithm
      const { learningState, interval, easeFactor, nextReview } = calculateNextReview(
        adjustedQuality,
        previousCardData
      );

      // Validate and ensure all dates are valid ISO strings
      let validNextReview;
      let validLastReviewed;

      try {
        // Validate nextReview
        const testNextReview = new Date(nextReview);
        if (isNaN(testNextReview.getTime())) {
          validNextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        } else {
          validNextReview = testNextReview.toISOString();
        }
      } catch (err) {
        console.error('Error validating nextReview:', err);
        validNextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      try {
        // Validate lastReviewed
        const now = new Date();
        if (isNaN(now.getTime())) {
          validLastReviewed = new Date(Date.now()).toISOString();
        } else {
          validLastReviewed = now.toISOString();
        }
      } catch (err) {
        console.error('Error creating lastReviewed:', err);
        validLastReviewed = new Date(Date.now()).toISOString();
      }

      // Prepare card progress data - only include defined values
      const cardProgressData = {
        cardId: currentCard.id,
        learningState,
        interval,
        easeFactor,
        nextReviewDate: validNextReview,
        lastReviewed: validLastReviewed,
        reviewCount: (previousCardData.reviewCount || 0) + 1
      };

      // Update progress
      const updatedProgress = {
        ...currentProgress,
        cards: {
          ...currentProgress.cards,
          [currentCard.id]: cardProgressData
        }
      };

      await setDoc(progressRef, updatedProgress);

      // Track round statistics
      if (quality === 1) {
        // Mark for retry (Again)
        setCardsToRetry([...cardsToRetry, currentCard]);
        setRoundStats({ ...roundStats, incorrect: roundStats.incorrect + 1 });
      } else {
        setRoundStats({ ...roundStats, correct: roundStats.correct + 1 });
      }

      // Move to next card
      setCurrentCardIndex(prev => {
        const nextIndex = prev + 1;
        // Save session state for resuming later
        if (user && cardOrder && cardOrder.length > 0) {
          saveStudySessionState(user.uid, deckId, nextIndex, currentRound, cardOrder).catch(err => 
            console.error('Error saving session state:', err)
          );
        }
        return nextIndex;
      });
    } catch (err) {
      console.error('Error saving progress:', err);
      setError('Failed to save progress');
    }
  };

  const saveStudySession = async (finalActiveTimeMs) => {
    if (!user || finalActiveTimeMs < 1000 || !deck) return; // Don't save sessions less than 1 second

    try {
      // Format date as YYYY-MM-DD using local browser date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const studySessionsRef = collection(db, 'studySessions');
      const durationSeconds = finalActiveTimeMs / 1000; // Convert ms to seconds

      await addDoc(studySessionsRef, {
        userId: user.uid,
        deckId: deckId,
        deckTitle: deck.title || 'Unknown Deck',
        date: today,
        duration: durationSeconds, // Store in seconds with precision
        durationMs: finalActiveTimeMs, // Store active milliseconds
        cardsStudied: currentCardIndex,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error saving study session:', err);
    }
  };

  const handleStartNextRound = async () => {
    if (cardsToRetry.length > 0) {
      // Clear saved session state before starting new round
      if (user) {
        await clearStudySessionState(user.uid, deckId);
      }

      // Start a new round with cards that were marked 'Again'
      // Shuffle cards for randomization
      const shuffledRetry = [...cardsToRetry].sort(() => Math.random() - 0.5);
      setDueCards(shuffledRetry);
      setCardOrder(shuffledRetry.map(card => card.id)); // Update card order for new round
      setCardsToRetry([]);
      setCurrentCardIndex(0);
      setCurrentRound(currentRound + 1);
      setRoundStats({ correct: 0, incorrect: 0 });
      const now = Date.now();
      setLastActivityTime(now);
      setCurrentSegmentStart(now);
      setIsActive(true);
      setActiveTimeMs(0);
    }
  };

  const handleBackToDashboard = async () => {
    // Calculate and save active study duration
    let finalActiveTime = activeTimeMs;
    if (isActive) {
      const currentSegmentDuration = Date.now() - currentSegmentStart;
      finalActiveTime += currentSegmentDuration;
    }

    if (finalActiveTime > 0) {
      await saveStudySession(finalActiveTime);
    }
    navigate('/dashboard');
  };

  const handleResumeSession = () => {
    if (!savedSession) return;
    
    // Restore the saved session state
    setCurrentCardIndex(savedSession.currentCardIndex);
    setCurrentRound(savedSession.currentRound);
    setShowResumePrompt(false);
  };

  const handleStartFresh = async () => {
    if (user && dueCards) {
      // Clear the saved session state
      await clearStudySessionState(user.uid, deckId);
    }
    
    setShowResumePrompt(false);
    setCurrentCardIndex(0);
    setCurrentRound(1);
    setSavedSession(null);
  };

  const handleReviewAgain = async () => {
    setCurrentCardIndex(0);
    setLoading(true);

    try {
      // Clear saved session state before starting new review
      if (user) {
        await clearStudySessionState(user.uid, deckId);
      }

      // Reload deck and load ALL cards (not just due cards)
      const deckRef = doc(db, 'decks', deckId);
      const deckSnap = await getDoc(deckRef);

      if (deckSnap.exists()) {
        const deckData = { id: deckSnap.id, ...deckSnap.data() };
        setDeck(deckData);

        // Load all cards from the deck for review again
        if (deckData.cards && deckData.cards.length > 0) {
          // Shuffle cards for randomization
          const shuffledCards = [...deckData.cards].sort(() => Math.random() - 0.5);
          setDueCards(shuffledCards);
          setCardOrder(shuffledCards.map(card => card.id)); // Update card order for review again
          // Restart timer for new session
          const now = Date.now();
          setLastActivityTime(now);
          setCurrentSegmentStart(now);
          setIsActive(true);
          setActiveTimeMs(0);
        } else {
          setError('No cards in this deck');
        }
      }
    } catch (err) {
      console.error('Error reloading deck:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={handleBackToDashboard}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem', background: '#ffffff' }}>
      <Container>
        {/* Header */}
        <div className="mb-4">
          <Button
            variant="outline-dark"
            onClick={handleBackToDashboard}
            className="d-flex align-items-center gap-2 mb-3 shadow-sm"
            style={{ background: '#ffffff', border: '2px solid #000' }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
          <div className="card glass-card shadow-xl p-4 rounded-4">
            <h2 className="mb-2 fw-bold" style={{ fontSize: '2rem', color: '#1e293b' }}>
              {deck?.title}
            </h2>
            <div>
              <span className="badge bg-primary" style={{ fontSize: '0.9rem' }}>
                {deck?.subject}
              </span>
              <span className="badge bg-info ms-2" style={{ fontSize: '0.9rem' }}>
                Round {currentRound}
              </span>
            </div>
          </div>
        </div>

        {/* Resume Session Prompt */}
        {showResumePrompt && savedSession && (
          <div className="d-flex justify-content-center mb-4">
            <div className="card glass-card shadow-lg p-4 rounded-3" style={{ maxWidth: '500px', borderLeft: '4px solid #0d6efd' }}>
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <span>📍</span> Continue Previous Session?
              </h5>
              <p className="text-muted mb-3">
                You were studying this deck. Continue from <strong>card {savedSession.currentCardIndex + 1}</strong> of <strong>{dueCards.length}</strong>?
              </p>
              <div className="d-flex gap-2 justify-content-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleStartFresh}
                >
                  Start Fresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResumeSession}
                >
                  Resume
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Study Card */}
        <div className="d-flex justify-content-center">
          <div style={{ width: '100%', maxWidth: '100%' }}>
            {currentCardIndex < dueCards.length && !showResumePrompt && (
              <StudyCard
                key={dueCards[currentCardIndex]?.id}
                card={dueCards[currentCardIndex]}
                onRate={handleRateCard}
                cardsRemaining={dueCards.length - currentCardIndex}
                currentIndex={currentCardIndex}
                totalCards={dueCards.length}
                allCards={dueCards}
                studyMode={studyMode}
                setStudyMode={setStudyMode}
              />
            )}
          </div>
        </div>

        {/* Session Complete */}
        {currentCardIndex >= dueCards.length && dueCards.length > 0 && (
          <div className="text-center mt-5">
            <div className="card glass-card shadow-lg p-5 rounded-3 mx-auto" style={{ maxWidth: '500px' }}>
              <h3 className="mb-3">🎉 Round {currentRound} Complete!</h3>
              <div className="mb-4">
                <div className="mb-2">
                  <span className="badge bg-success me-2">✓ Correct: {roundStats.correct}</span>
                  <span className="badge bg-danger">✗ To Review: {cardsToRetry.length}</span>
                </div>
              </div>

              {cardsToRetry.length > 0 ? (
                <>
                  <p className="text-muted mb-4">You have {cardsToRetry.length} card(s) to review. Let's practice them again!</p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartNextRound}
                      className="px-4"
                    >
                      Start Round {currentRound + 1}
                    </Button>
                    <Button
                      variant="outline-dark"
                      size="lg"
                      onClick={handleBackToDashboard}
                      className="px-4"
                    >
                      Finish & Return
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted mb-4">Perfect! You've mastered all cards this round!</p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      variant="outline-dark"
                      size="lg"
                      onClick={handleReviewAgain}
                      className="px-4"
                    >
                      Review All Again
                    </Button>
                    <Button
                      variant="dark"
                      size="lg"
                      onClick={handleBackToDashboard}
                      className="px-4"
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Study;
