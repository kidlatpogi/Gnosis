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
      <Row xs={1} md={2} lg={3} className="g-5">
        {decks.map((deck) => {
          const stats = deckStats?.[deck.id] || {
            total: deck.cards?.length || 0,
            mastered: 0,
            due: deck.cards?.length || 0
          };

          return (
            <Col key={deck.id}>
              <Card className="h-100 glass-card hover-shadow rounded-4" style={{ transition: 'all 0.3s', border: 'none' }}>
                <Card.Body className="d-flex flex-column p-4">
                  {/* Deck Header */}
                  <div className="mb-3">
                    <h5 className="fw-bold mb-2" style={{ fontSize: '1.4rem', color: '#1e293b' }}>{deck.title}</h5>
                    <Badge
                      bg="dark"
                      className="mb-2"
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.4em 0.8em',
                        background: '#000000',
                        border: 'none',
                        color: '#ffffff'
                      }}
                    >
                      {deck.subject}
                    </Badge>
                  </div>

                  {/* Deck Stats */}
                  <div className="mb-3 flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <BookOpen size={16} className="text-primary" />
                      <small className="text-muted">
                        <strong>{stats.total}</strong> {stats.total === 1 ? 'card' : 'cards'}
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Clock size={16} className="text-warning" />
                      <small className="text-muted">
                        <strong>{stats.due}</strong> due today
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <TrendingUp size={16} className="text-success" />
                      <small className="text-muted">
                        <strong>{stats.mastered}</strong> mastered
                      </small>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex flex-column gap-2">
                    {/* Primary Study Button */}
                    <Button
                      variant={stats.due > 0 ? "primary" : "outline-primary"}
                      onClick={() => {
                        if (onStudy) {
                          onStudy(deck.id);
                        } else {
                          console.log('Study deck:', deck.id);
                        }
                      }}
                      disabled={stats.total === 0}
                      className="w-100"
                      style={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        padding: '0.75rem'
                      }}
                    >
                      {stats.due > 0 ? (
                        <>
                          <BookOpen size={18} className="me-2" />
                          Study ({stats.due})
                        </>
                      ) : (
                        <>
                          <BookOpen size={18} className="me-2" />
                          Review
                        </>
                      )}
                    </Button>

                    {/* Secondary Action Buttons */}
                    <ButtonGroup className="w-100">
                      <Button
                        variant="outline-secondary"
                        onClick={() => onEditCards && onEditCards(deck)}
                        title="Edit cards"
                        style={{
                          flex: 1,
                          fontWeight: 600
                        }}
                      >
                        <FileEdit size={16} className="me-1" />
                        <span className="d-none d-md-inline">Cards</span>
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => navigate('/shared-decks', { state: { shareDeck: deck } })}
                        title="Share with friends"
                        style={{
                          flex: 1,
                          fontWeight: 600
                        }}
                      >
                        <Share2 size={16} className="me-1" />
                        <span className="d-none d-md-inline">Share</span>
                      </Button>
                      <Button
                        variant="outline-dark"
                        onClick={() => onEdit && onEdit(deck)}
                        title="Edit deck info"
                        style={{
                          flex: 1,
                          fontWeight: 600
                        }}
                      >
                        <Edit2 size={16} className="me-1" />
                        <span className="d-none d-md-inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleDeleteClick(deck)}
                        title="Delete deck"
                        style={{
                          flex: 1,
                          fontWeight: 600
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </ButtonGroup>
                  </div>

                  {/* Creator Info */}
                  {deck.createdAt && (
                    <small className="text-muted text-center mt-2">
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
