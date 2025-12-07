import { Row, Col, Card, Button, Badge, ButtonGroup, Modal } from 'react-bootstrap';
import { BookOpen, Clock, TrendingUp, Edit2, Trash2, Share2, FileEdit } from 'lucide-react';
import { useState } from 'react';
import { deleteDeck } from '../lib/db';
import { useNavigate } from 'react-router-dom';

const DeckList = ({ decks, deckStats, onStudy, onEdit, onEditCards, onDelete }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (deck) => {
    setDeckToDelete(deck);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deckToDelete) return;

    try {
      setDeleting(true);
      await deleteDeck(deckToDelete.id);
      setShowDeleteModal(false);
      setDeckToDelete(null);

      // Call parent callback if provided
      if (onDelete) {
        onDelete(deckToDelete.id);
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      alert('Failed to delete deck. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!decks || decks.length === 0) {
    return (
      <Card className="text-center p-5 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">No decks available yet</h4>
          <p className="text-muted">
            Click the "Create Deck" button above to create your first flashcard deck!
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Row xs={1} md={2} lg={3} className="g-4">
        {decks.map((deck) => {
          const stats = deckStats?.[deck.id] || {
            total: deck.cards?.length || 0,
            mastered: 0,
            due: deck.cards?.length || 0
          };

          return (
            <Col key={deck.id}>
              <Card className="h-100 shadow-sm" style={{
                transition: 'all 0.2s',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                <Card.Body className="d-flex flex-column p-3">
                  {/* Deck Header */}
                  <div className="mb-2">
                    <h5 className="fw-bold mb-1" style={{ fontSize: '1.1rem', color: '#000000' }}>
                      {deck.title}
                    </h5>
                    <Badge
                      bg="dark"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25em 0.6em',
                        fontWeight: 'normal'
                      }}
                    >
                      {deck.subject}
                    </Badge>
                  </div>

                  {/* Deck Stats - Compact Horizontal Layout */}
                  <div className="mb-3 d-flex align-items-center gap-3" style={{ fontSize: '0.85rem' }}>
                    <div className="d-flex align-items-center gap-1">
                      <BookOpen size={14} className="text-primary" />
                      <span><strong>{stats.total}</strong> cards</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <Clock size={14} className="text-warning" />
                      <span><strong>{stats.due}</strong> due today</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <TrendingUp size={14} className="text-success" />
                      <strong>{stats.mastered}</strong> mastered
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto">
                    {/* Primary Review Button */}
                    <Button
                      variant={stats.due > 0 ? "primary" : "outline-primary"}
                      onClick={() => {
                        if (onStudy) {
                          onStudy(deck.id);
                        }
                      }}
                      disabled={stats.total === 0}
                      className="w-100 mb-2"
                      size="sm"
                    >
                      <BookOpen size={16} className="me-1" />
                      {stats.due > 0 ? `Review` : 'Review'}
                    </Button>

                    {/* Secondary Action Buttons */}
                    <ButtonGroup className="w-100" size="sm">
                      <Button
                        variant="outline-secondary"
                        onClick={() => onEditCards && onEditCards(deck)}
                        title="Edit cards"
                      >
                        <FileEdit size={14} />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/shared-decks', { state: { shareDeck: deck } })}
                        title="Share with friends"
                      >
                        <Share2 size={14} />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => onEdit && onEdit(deck)}
                        title="Edit deck info"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleDeleteClick(deck)}
                        title="Delete deck"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </ButtonGroup>
                  </div>

                  {/* Creator Info */}
                  {deck.createdAt && (
                    <small className="text-muted text-center mt-2" style={{ fontSize: '0.7rem' }}>
                      Created {new Date(deck.createdAt?.toDate?.() || deck.createdAt).toLocaleDateString()}
                    </small>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered>
        <Modal.Header closeButton disabled={deleting}>
          <Modal.Title>⚠️ Delete Deck</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>"{deckToDelete?.title}"</strong>?</p>
          <p className="text-muted mb-0">This action cannot be undone. All cards in this deck will be permanently deleted.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Deck'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeckList;
