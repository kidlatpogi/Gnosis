import { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import StudyCard from '../components/StudyCard';
import { calculateNextReview, adjustQualityForHint, isCardDue } from '../utils/sm2_algorithm';
import { ArrowLeft } from 'lucide-react';

const Study = () => {
  const { deckId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [dueCards, setDueCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [studyDuration, setStudyDuration] = useState(0);

  useEffect(() => {
    loadDeckAndProgress();
  }, [deckId, user]);

  // Update study duration every minute
  useEffect(() => {
    if (!sessionStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000); // minutes
      setStudyDuration(elapsed);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Save session when all cards are completed
  useEffect(() => {
    if (currentCardIndex >= dueCards.length && dueCards.length > 0 && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
      saveStudySession(duration);
      setSessionStartTime(null); // Reset timer
    }
  }, [currentCardIndex, dueCards.length, sessionStartTime]);

  const loadDeckAndProgress = async () => {
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

      // Filter cards that are due for review
      const cardsToReview = deckData.cards.filter(card => {
        const cardProgress = userProgress.cards?.[card.id];
        if (!cardProgress) return true; // New card
        return isCardDue(cardProgress.nextReviewDate);
      });

      setDueCards(cardsToReview);
      
      // Start tracking study time
      if (cardsToReview.length > 0) {
        setSessionStartTime(Date.now());
      }
    } catch (err) {
      console.error('Error loading deck:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRateCard = async (quality, hintUsed) => {
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

      // Update progress
      const updatedProgress = {
        ...currentProgress,
        cards: {
          ...currentProgress.cards,
          [currentCard.id]: {
            cardId: currentCard.id,
            learningState,
            interval,
            easeFactor,
            nextReviewDate: nextReview,
            lastReviewed: new Date().toISOString(),
            reviewCount: (previousCardData.reviewCount || 0) + 1
          }
        }
      };

      await setDoc(progressRef, updatedProgress);

      // Move to next card
      setCurrentCardIndex(prev => prev + 1);
    } catch (err) {
      console.error('Error saving progress:', err);
      setError('Failed to save progress');
    }
  };

  const saveStudySession = async (duration) => {
    if (!user || duration < 1) return; // Don't save sessions less than 1 minute
    
    try {
      // Format date as YYYY-MM-DD using Philippines timezone (GMT+8)
      const now = new Date();
      const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const year = phTime.getFullYear();
      const month = String(phTime.getMonth() + 1).padStart(2, '0');
      const day = String(phTime.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      const studySessionsRef = collection(db, 'studySessions');
      
      await addDoc(studySessionsRef, {
        userId: user.uid,
        deckId: deckId,
        deckTitle: deck?.title || 'Unknown Deck',
        date: today,
        duration: duration, // in minutes
        cardsStudied: currentCardIndex,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error saving study session:', err);
    }
  };

  const handleBackToDashboard = async () => {
    // Calculate and save study duration
    if (sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 60000); // Convert to minutes
      await saveStudySession(duration);
    }
    navigate('/dashboard');
  };

  const handleReviewAgain = async () => {
    setCurrentCardIndex(0);
    setLoading(true);
    
    try {
      // Reload deck and load ALL cards (not just due cards)
      const deckRef = doc(db, 'decks', deckId);
      const deckSnap = await getDoc(deckRef);
      
      if (deckSnap.exists()) {
        const deckData = { id: deckSnap.id, ...deckSnap.data() };
        setDeck(deckData);
        
        // Load all cards from the deck for review again
        if (deckData.cards && deckData.cards.length > 0) {
          setDueCards(deckData.cards);
          // Restart timer for new session
          setSessionStartTime(Date.now());
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
            </div>
          </div>
        </div>

        {/* Study Card */}
        <div className="d-flex justify-content-center">
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <StudyCard
              card={dueCards[currentCardIndex]}
              onRate={handleRateCard}
              cardsRemaining={dueCards.length - currentCardIndex}
              currentIndex={currentCardIndex}
              totalCards={dueCards.length}
              allCards={dueCards}
            />
          </div>
        </div>

        {/* Session Complete */}
        {currentCardIndex >= dueCards.length && (
          <div className="text-center mt-5">
            <div className="card glass-card shadow-lg p-5 rounded-3 mx-auto" style={{ maxWidth: '500px' }}>
              <h3 className="mb-3">🎉 Great Job!</h3>
              <p className="text-muted mb-4">You've completed this study session</p>
              <div className="d-flex gap-3 justify-content-center">
                <Button 
                  variant="outline-dark" 
                  size="lg" 
                  onClick={handleReviewAgain}
                  className="px-4"
                >
                  Review Again
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
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Study;
