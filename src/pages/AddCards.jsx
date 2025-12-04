import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AddCards = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      setLoading(true);
      const deckRef = doc(db, 'decks', deckId);
      const deckSnap = await getDoc(deckRef);
      
      if (deckSnap.exists()) {
        const deckData = { id: deckSnap.id, ...deckSnap.data() };
        setDeck(deckData);
        setCards(deckData.cards || []);
      } else {
        setError('Deck not found');
      }
    } catch (err) {
      console.error('Error loading deck:', err);
      setError('Failed to load deck');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    if (!front.trim() || !back.trim()) {
      setError('Front and back are required');
      return;
    }

    const newCard = {
      id: Date.now().toString(),
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || null
    };

    if (editingId) {
      setCards(cards.map(c => c.id === editingId ? newCard : c));
      setEditingId(null);
    } else {
      setCards([...cards, newCard]);
    }

    setFront('');
    setBack('');
    setHint('');
    setError(null);
  };

  const handleEditCard = (card) => {
    setFront(card.front);
    setBack(card.back);
    setHint(card.hint || '');
    setEditingId(card.id);
  };

  const handleDeleteCard = (cardId) => {
    setCards(cards.filter(c => c.id !== cardId));
    if (editingId === cardId) {
      setFront('');
      setBack('');
      setHint('');
      setEditingId(null);
    }
  };

  const handleSaveDeck = async () => {
    if (cards.length === 0) {
      setError('Please add at least one card');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const deckRef = doc(db, 'decks', deckId);
      await updateDoc(deckRef, { cards });

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving cards:', err);
      setError('Failed to save cards');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem', background: '#ffffff' }}>
      <Container style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="mb-4">
          <Button 
            variant="outline-dark" 
            onClick={() => navigate('/dashboard')}
            className="d-flex align-items-center gap-2 mb-3"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
          <h1 className="fw-bold" style={{ fontSize: '2.5rem', color: '#000000' }}>
            Add Cards to "{deck?.title}"
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Step 2: Create your flashcards
          </p>
        </div>

        <div className="row g-4">
          {/* Left: Add Card Form */}
          <div className="col-lg-6">
            <Card className="glass-card shadow-xl rounded-4 p-4 h-100">
              <Card.Body>
                <h4 className="mb-4 fw-bold">
                  {editingId ? '✏️ Edit Card' : '➕ Add New Card'}
                </h4>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Front (Question)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter the question or term..."
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Back (Answer)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter the answer or definition..."
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Hint (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Add a helpful hint..."
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleAddCard}
                      disabled={!front.trim() || !back.trim()}
                      className="flex-fill d-flex align-items-center justify-content-center gap-2"
                    >
                      {editingId ? (
                        <>
                          <Save size={18} />
                          Update Card
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Add Card
                        </>
                      )}
                    </Button>
                    {editingId && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setFront('');
                          setBack('');
                          setHint('');
                          setEditingId(null);
                        }}
                      >
                        <X size={18} />
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>

          {/* Right: Card List */}
          <div className="col-lg-6">
            <Card className="glass-card shadow-xl rounded-4 p-4 h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0 fw-bold">📚 Cards ({cards.length})</h4>
                  {cards.length > 0 && (
                    <Button
                      variant="success"
                      onClick={handleSaveDeck}
                      disabled={saving}
                      className="d-flex align-items-center gap-2"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Finish & Save'}
                    </Button>
                  )}
                </div>

                {cards.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <p>No cards yet</p>
                    <small>Add your first card using the form →</small>
                  </div>
                ) : (
                  <ListGroup variant="flush" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {cards.map((card, idx) => (
                      <ListGroup.Item key={card.id} className="border-0 mb-2 rounded-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <Badge bg="secondary" className="mb-2">Card {idx + 1}</Badge>
                            <div className="mb-2">
                              <strong>Q:</strong> {card.front}
                            </div>
                            <div className="mb-2">
                              <strong>A:</strong> {card.back}
                            </div>
                            {card.hint && (
                              <div className="text-muted">
                                <small>💡 {card.hint}</small>
                              </div>
                            )}
                          </div>
                          <div className="d-flex gap-2 ms-3">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditCard(card)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AddCards;
