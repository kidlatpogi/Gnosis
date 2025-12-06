import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { Share2, Download, Gift, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  listenToSharedDecks,
  importSharedDeck, 
  shareDeck, 
  listenToFriends,
  getAllDecks 
} from '../lib/db';
import { useNavigate } from 'react-router-dom';

function SharedDecks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sharedDecks, setSharedDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState('');

  useEffect(() => {
    if (!user) return;

    // Real-time listener for shared decks
    const unsubscribeShared = listenToSharedDecks(user.uid, (decks) => {
      const previousCount = sharedDecks.length;
      setSharedDecks(decks);
      
      // Show notification for new shared decks
      if (decks.length > previousCount && previousCount > 0) {
        setMessage({ 
          type: 'info', 
          text: `You have ${decks.length - previousCount} new deck${decks.length - previousCount > 1 ? 's' : ''} shared with you!` 
        });
      }
    });

    // Real-time listener for friends
    const unsubscribeFriends = listenToFriends(user.uid, (friendsList) => {
      setFriends(friendsList);
    });

    // Load user's own decks
    loadMyDecks();

    return () => {
      unsubscribeShared();
      unsubscribeFriends();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadMyDecks = async () => {
    try {
      const decks = await getAllDecks();
      // Filter to only user's decks
      const userDecks = decks.filter(deck => deck.creatorId === user.uid);
      setMyDecks(userDecks);
    } catch (error) {
      console.error('Error loading my decks:', error);
    }
  };

  const handleImport = async (shareId, deck) => {
    setLoading(true);
    try {
      await importSharedDeck(shareId, user.uid, deck);
      setMessage({ type: 'success', text: `Deck "${deck.title}" imported successfully!` });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to import deck. Try again.' });
      console.error('Error importing deck:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = (deck) => {
    setSelectedDeck(deck);
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!selectedFriend) return;

    setLoading(true);
    try {
      await shareDeck(selectedDeck.id, user.uid, selectedFriend);
      setMessage({ type: 'success', text: `Deck "${selectedDeck.title}" shared successfully!` });
      setShowShareModal(false);
      setSelectedDeck(null);
      setSelectedFriend('');
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to share deck. Try again.' });
      console.error('Error sharing deck:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 mb-2">
            <Gift className="me-3" size={48} />
            Shared Decks
          </h1>
          <p className="text-muted">Share your decks with friends or import decks shared with you</p>
        </Col>
      </Row>

      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Row className="mb-5">
        <Col>
          <Card>
            <Card.Body>
              <h5 className="mb-3">
                <Download className="me-2" size={20} />
                Decks Shared With You
                {sharedDecks.length > 0 && (
                  <Badge bg="primary" className="ms-2">{sharedDecks.length}</Badge>
                )}
              </h5>
              {sharedDecks.length === 0 ? (
                <p className="text-muted mb-0">No decks shared with you yet</p>
              ) : (
                <ListGroup>
                  {sharedDecks.map((share) => (
                    <ListGroup.Item key={share.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{share.deck.title}</strong>
                        <div className="small text-muted">
                          Subject: {share.deck.subject} • {share.deck.cards?.length || 0} cards
                        </div>
                        <div className="small text-muted">Shared by: {share.fromUserId}</div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleImport(share.id, share.deck)}
                        disabled={loading}
                      >
                        <Download size={16} className="me-1" />
                        Import
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5 className="mb-3">
                <Share2 className="me-2" size={20} />
                My Decks
                <Badge bg="secondary" className="ms-2">{myDecks.length}</Badge>
              </h5>
              {myDecks.length === 0 ? (
                <p className="text-muted mb-0">
                  You haven't created any decks yet. 
                  <Button variant="link" className="p-0 ms-1" onClick={() => navigate('/create-deck')}>
                    Create one now
                  </Button>
                </p>
              ) : friends.length === 0 ? (
                <p className="text-muted mb-0">
                  Add friends to share your decks with them.
                  <Button variant="link" className="p-0 ms-1" onClick={() => navigate('/friends')}>
                    Add friends
                  </Button>
                </p>
              ) : (
                <ListGroup>
                  {myDecks.map((deck) => (
                    <ListGroup.Item key={deck.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{deck.title}</strong>
                        <div className="small text-muted">
                          Subject: {deck.subject} • {deck.cards?.length || 0} cards
                        </div>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShareClick(deck)}
                      >
                        <Share2 size={16} className="me-1" />
                        Share
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share Deck</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDeck && (
            <>
              <p>Share <strong>{selectedDeck.title}</strong> with:</p>
              <Form.Group>
                <Form.Label>Select Friend</Form.Label>
                <Form.Select 
                  value={selectedFriend} 
                  onChange={(e) => setSelectedFriend(e.target.value)}
                >
                  <option value="">Choose a friend...</option>
                  {friends.map((friendId) => (
                    <option key={friendId} value={friendId}>
                      User: {friendId}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleShareSubmit}
            disabled={!selectedFriend || loading}
          >
            <Share2 size={16} className="me-1" />
            Share
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default SharedDecks;
