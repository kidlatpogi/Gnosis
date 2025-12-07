import { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, Badge, Alert, Row, Col } from 'react-bootstrap';
import { Plus, Trash2, ArrowRight, ArrowLeft, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createDeck, updateDeck } from '../lib/db';

const AddDeckModal = ({ show, onHide, onDeckCreated, existingDeck = null, startAtCardsStep = false }) => {
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

      // If startAtCardsStep is true, skip to step 2
      if (startAtCardsStep) {
        setStep(2);
      }
    }
  }, [existingDeck, show, startAtCardsStep]);

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

    // If in edit mode, save directly instead of going to step 2
    if (isEditMode) {
      handleSaveDeck();
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

      // Clean cards data - remove undefined values
      const cleanedCards = cards.map(card => {
        const cleanCard = {
          id: card.id,
          front: card.front,
          back: card.back
        };
        // Only add hint if it exists and is not undefined
        if (card.hint && card.hint.trim()) {
          cleanCard.hint = card.hint;
        }
        return cleanCard;
      });

      const deckData = {
        title: title.trim(),
        subject: subject.trim() || 'General',
        cards: cleanedCards
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

        {/* Step 2: Add Cards - TWO COLUMN LAYOUT */}
        {step === 2 && (
          <Row className="g-3">
            {/* Left Column: Add Card Form */}
            <Col md={6}>
              <h6 className="mb-3 fw-bold">
                {editingCardId ? '✏️ Edit Card' : '➕ Add New Card'}
              </h6>

              <Form>
                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Front (Question)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter the question or term..."
                    value={currentFront}
                    onChange={(e) => setCurrentFront(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Back (Answer)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter the answer or definition..."
                    value={currentBack}
                    onChange={(e) => setCurrentBack(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Hint (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Add a helpful hint..."
                    value={currentHint}
                    onChange={(e) => setCurrentHint(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Hints can be shown during study without flipping the card
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={addCard}
                    disabled={!currentFront.trim() || !currentBack.trim()}
                    className="flex-fill d-flex align-items-center justify-content-center gap-2"
                  >
                    {editingCardId ? (
                      <>
                        <Edit2 size={18} />
                        Update Card
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Card
                      </>
                    )}
                  </Button>
                  {editingCardId && (
                    <Button
                      variant="outline-secondary"
                      onClick={cancelEdit}
                    >
                      <X size={18} />
                    </Button>
                  )}
                </div>
              </Form>
            </Col>

            {/* Right Column: Cards List */}
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold">📚 Cards ({cards.length})</h6>
              </div>

              {cards.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No cards yet</p>
                  <small>Add your first card using the form ←</small>
                </div>
              ) : (
                <ListGroup variant="flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {cards.map((card, index) => (
                    <ListGroup.Item
                      key={card.id}
                      className="border-0 mb-2 rounded-3 shadow-sm"
                      variant={editingCardId === card.id ? 'primary' : undefined}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <Badge bg="secondary" className="mb-2">Card {index + 1}</Badge>
                          <div className="mb-2">
                            <strong>Q:</strong> {card.front.substring(0, 50)}
                            {card.front.length > 50 ? '...' : ''}
                          </div>
                          <div className="mb-2">
                            <strong>A:</strong> {card.back.substring(0, 50)}
                            {card.back.length > 50 ? '...' : ''}
                          </div>
                          {card.hint && (
                            <div className="text-muted">
                              <small>💡 {card.hint.substring(0, 30)}
                                {card.hint.length > 30 ? '...' : ''}
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="d-flex gap-2 ms-3">
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
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === 1 ? (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNextStep}>
              {isEditMode ? 'Save Deck' : 'Next: Add Cards'}
              {!isEditMode && <ArrowRight size={18} className="ms-2" />}
            </Button>
          </>
        ) : (
          <>
            {!startAtCardsStep && (
              <Button variant="outline-secondary" onClick={handlePreviousStep}>
                <ArrowLeft size={18} className="me-2" />
                Back
              </Button>
            )}
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
