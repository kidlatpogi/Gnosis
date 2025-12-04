import { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, ListGroup, Badge, Alert } from 'react-bootstrap';
import { Plus, Trash2, ArrowRight, ArrowLeft, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createDeck, updateDeck } from '../lib/db';

const AddDeckModal = ({ show, onHide, onDeckCreated, existingDeck = null }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // Step 1: Deck info, Step 2: Cards
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditMode = !!existingDeck;

  // Deck basic info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');

  // Cards
  const [cards, setCards] = useState([]);
  const [currentFront, setCurrentFront] = useState('');
  const [currentBack, setCurrentBack] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [editingCardId, setEditingCardId] = useState(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingDeck && show) {
      setTitle(existingDeck.title || '');
      setSubject(existingDeck.subject || '');
      setCards(existingDeck.cards || []);
    }
  }, [existingDeck, show]);

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setSubject('');
    setCards([]);
    setCurrentFront('');
    setCurrentBack('');
    setCurrentHint('');
    setEditingCardId(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const handleNextStep = () => {
    // Validate Step 1
    if (!title.trim()) {
      setError('Please enter a deck title');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handlePreviousStep = () => {
    setError(null);
    setStep(1);
  };

  const addCard = () => {
    if (!currentFront.trim() || !currentBack.trim()) {
      setError('Both front and back of the card are required');
      return;
    }

    if (editingCardId) {
      // Update existing card
      setCards(cards.map(card => 
        card.id === editingCardId 
          ? { ...card, front: currentFront.trim(), back: currentBack.trim(), hint: currentHint.trim() || undefined }
          : card
      ));
      setEditingCardId(null);
    } else {
      // Add new card
      const newCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        front: currentFront.trim(),
        back: currentBack.trim(),
        hint: currentHint.trim() || undefined
      };
      setCards([...cards, newCard]);
    }

    setCurrentFront('');
    setCurrentBack('');
    setCurrentHint('');
    setError(null);
  };

  const editCard = (card) => {
    setCurrentFront(card.front);
    setCurrentBack(card.back);
    setCurrentHint(card.hint || '');
    setEditingCardId(card.id);
  };

  const cancelEdit = () => {
    setCurrentFront('');
    setCurrentBack('');
    setCurrentHint('');
    setEditingCardId(null);
  };

  const removeCard = (cardId) => {
    setCards(cards.filter(card => card.id !== cardId));
    if (editingCardId === cardId) {
      cancelEdit();
    }
  };

  const handleSaveDeck = async () => {
    // Validation
    if (!title.trim()) {
      setError('Deck title is required');
      return;
    }

    if (cards.length === 0) {
      setError('Please add at least one card to the deck');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const deckData = {
        title: title.trim(),
        subject: subject.trim() || 'General',
        cards: cards
      };

      if (isEditMode && existingDeck) {
        // Update existing deck
        await updateDeck(existingDeck.id, deckData);
      } else {
        // Create new deck
        await createDeck(user.uid, deckData);
      }

      // Success - notify parent and close
      if (onDeckCreated) {
        onDeckCreated();
      }

      handleClose();
    } catch (err) {
      console.error('Error saving deck:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} deck. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? 'Edit Deck' : step === 1 ? 'Create New Deck' : 'Add Cards'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step 1: Deck Info */}
        {step === 1 && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Deck Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Spanish Vocabulary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Languages, Programming, Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Form.Text className="text-muted">
                Optional - helps categorize your deck
              </Form.Text>
            </Form.Group>
          </Form>
        )}

        {/* Step 2: Add Cards */}
        {step === 2 && (
          <>
            <div className="mb-4">
              <h6 className="mb-3">Add Cards to: <Badge bg="primary">{title}</Badge></h6>
              
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Front (Question)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="What appears on the front of the card?"
                    value={currentFront}
                    onChange={(e) => setCurrentFront(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Back (Answer)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="What appears on the back of the card?"
                    value={currentBack}
                    onChange={(e) => setCurrentBack(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Hint (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="A subtle clue to help with recall"
                    value={currentHint}
                    onChange={(e) => setCurrentHint(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Hints can be shown during study without flipping the card
                  </Form.Text>
                </Form.Group>

                {editingCardId && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={cancelEdit}
                    className="w-100 mb-2"
                  >
                    Cancel Edit
                  </Button>
                )}

                <Button 
                  variant="outline-primary" 
                  onClick={addCard}
                  className="w-100 mb-3"
                  disabled={!currentFront.trim() || !currentBack.trim()}
                >
                  {editingCardId ? (
                    <>
                      <Edit2 size={18} className="me-2" />
                      Update Card
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="me-2" />
                      Add Card
                    </>
                  )}
                </Button>
              </Form>
            </div>

            {/* Card List */}
            {cards.length > 0 && (
              <>
                <h6 className="mb-2">
                  Cards Added ({cards.length})
                </h6>
                <ListGroup className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {cards.map((card, index) => (
                    <ListGroup.Item 
                      key={card.id}
                      className="d-flex justify-content-between align-items-center"
                      variant={editingCardId === card.id ? 'primary' : undefined}
                    >
                      <div className="flex-grow-1">
                        <div className="fw-bold">#{index + 1}</div>
                        <small className="text-muted d-block">
                          <strong>Q:</strong> {card.front.substring(0, 40)}
                          {card.front.length > 40 ? '...' : ''}
                        </small>
                        {card.hint && (
                          <small className="text-info d-block">
                            💡 {card.hint.substring(0, 30)}
                            {card.hint.length > 30 ? '...' : ''}
                          </small>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => editCard(card)}
                          disabled={editingCardId !== null}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeCard(card.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}

            {cards.length === 0 && (
              <Alert variant="info">
                No cards added yet. Add at least one card to save the deck.
              </Alert>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === 1 ? (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNextStep}>
              Next: Add Cards
              <ArrowRight size={18} className="ms-2" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={handlePreviousStep}>
              <ArrowLeft size={18} className="me-2" />
              Back
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleSaveDeck}
              disabled={loading || cards.length === 0}
            >
              {loading ? 'Saving...' : `Save Deck (${cards.length} cards)`}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AddDeckModal;
