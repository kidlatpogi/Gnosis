import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { Plus, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllDecks, getUserProgress, seedDatabase } from '../lib/db';
import { isCardDue } from '../utils/sm2_algorithm';
import AddDeckModal from '../components/AddDeckModal';
import DeckList from '../components/DeckList';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deckStats, setDeckStats] = useState({});
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);

  useEffect(() => {
    loadDecks();
  }, [user]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all decks using helper function
      const decksData = await getAllDecks();
      setDecks(decksData);

      // Load user progress for each deck
      if (user) {
        const stats = {};
        for (const deck of decksData) {
          try {
            const progress = await getUserProgress(user.uid, deck.id);
            
            if (progress && progress.cards) {
              const dueCards = Object.values(progress.cards).filter(card => 
                isCardDue(card.nextReviewDate)
              );
              
              stats[deck.id] = {
                total: deck.cards?.length || 0,
                mastered: Object.keys(progress.cards).length,
                due: dueCards.length
              };
            } else {
              stats[deck.id] = {
                total: deck.cards?.length || 0,
                mastered: 0,
                due: deck.cards?.length || 0
              };
            }
          } catch (err) {
            console.error(`Error loading progress for deck ${deck.id}:`, err);
            stats[deck.id] = {
              total: deck.cards?.length || 0,
              mastered: 0,
              due: deck.cards?.length || 0
            };
          }
        }
        setDeckStats(stats);
      }
    } catch (error) {
      console.error('Error loading decks:', error);
      setError('Failed to load decks. Please try again.');
      alert('Error: Failed to load decks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudy = (deckId) => {
    navigate(`/study/${deckId}`);
  };

  const handleDeckCreated = () => {
    // Reload decks after creating/updating a deck
    loadDecks();
    setEditingDeck(null);
  };

  const handleEditDeck = (deck) => {
    setEditingDeck(deck);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingDeck(null);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem', background: '#ffffff' }}>
      <Container>
        {/* Header Card */}
        <div className="card glass-card shadow-lg mb-5 p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="mb-2 fw-bold" style={{ fontSize: '2.5rem', color: '#000000' }}>
                Your Decks
              </h1>
              <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                Master knowledge through spaced repetition
              </p>
            </div>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/create-deck')}
              className="d-flex align-items-center gap-2 px-4 py-3 shadow-sm"
              style={{ fontSize: '1.1rem' }}
            >
              <Plus size={22} />
              Create Deck
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="shadow-lg rounded-4">
            <Alert.Heading>⚠️ Oops! Something went wrong</Alert.Heading>
            <p className="mb-0">{error}</p>
          </Alert>
        )}

      {/* Deck List */}
      <DeckList 
        decks={decks} 
        deckStats={deckStats}
        onStudy={handleStudy}
        onEdit={handleEditDeck}
      />

        {/* Empty State */}
        {decks.length === 0 && !loading && (
          <div className="card glass-card shadow-xl text-center p-5 mt-4">
            <div className="mb-4">
              <span style={{ fontSize: '5rem' }}>🎯</span>
            </div>
            <h3 className="mb-3 fw-bold" style={{ fontSize: '2rem' }}>No decks yet!</h3>
            <p className="text-muted mb-4" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              Start your learning journey by creating your first deck, or try our sample deck.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/create-deck')}
                className="d-flex align-items-center gap-2 px-4 py-3 shadow-sm"
                style={{ fontSize: '1.1rem' }}
              >
                <Plus size={22} />
                Create First Deck
              </Button>
              <Button 
                variant="outline-dark" 
                size="lg"
                onClick={async () => {
                  try {
                    await seedDatabase();
                    loadDecks();
                  } catch (err) {
                    console.error('Failed to seed:', err);
                  }
                }}
                className="d-flex align-items-center gap-2 px-4 py-3"
                style={{ fontSize: '1.1rem' }}
              >
                <Database size={22} />
                Try Sample Deck
              </Button>
            </div>
          </div>
        )}

        {/* Add/Edit Deck Modal */}
        <AddDeckModal
          show={showAddModal}
          onHide={handleModalClose}
          onDeckCreated={handleDeckCreated}
          existingDeck={editingDeck}
        />
      </Container>
    </div>
  );
};

export default Dashboard;
