import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Alert } from 'react-bootstrap';
import { UserPlus, Users, Check, X, Mail, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  listenToFriendRequests,
  listenToFriends
} from '../lib/db';

function Friends() {
  const { user } = useAuth();
  const [friendEmail, setFriendEmail] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newRequestCount, setNewRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for friend requests
    const unsubscribeRequests = listenToFriendRequests(user.email, (requests) => {
      const previousCount = friendRequests.length;
      setFriendRequests(requests);
      
      // Show notification for new requests
      if (requests.length > previousCount && previousCount > 0) {
        setNewRequestCount(requests.length - previousCount);
        setMessage({ 
          type: 'info', 
          text: `You have ${requests.length - previousCount} new friend request${requests.length - previousCount > 1 ? 's' : ''}!` 
        });
      }
    });

    // Set up real-time listener for friends list
    const unsubscribeFriends = listenToFriends(user.uid, (friendsList) => {
      setFriends(friendsList);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (friendEmail === user.email) {
        setMessage({ type: 'danger', text: 'You cannot add yourself as a friend!' });
        setLoading(false);
        return;
      }

      await sendFriendRequest(user.uid, friendEmail.trim());
      setMessage({ type: 'success', text: `Friend request sent to ${friendEmail}!` });
      setFriendEmail('');
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to send friend request. Try again.' });
      console.error('Error sending friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, friendId) => {
    try {
      await acceptFriendRequest(requestId, user.uid, friendId);
      setMessage({ type: 'success', text: 'Friend request accepted!' });
      setNewRequestCount(0);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to accept request.' });
      console.error('Error accepting friend request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      setMessage({ type: 'info', text: 'Friend request rejected.' });
      setNewRequestCount(0);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to reject request.' });
      console.error('Error rejecting friend request:', error);
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 mb-2">
            <Users className="me-3" size={48} />
            Friends
          </h1>
          <p className="text-muted">Connect with friends and share your learning journey</p>
        </Col>
      </Row>

      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Row className="mb-4">
        <Col lg={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">
                <UserPlus className="me-2" size={20} />
                Add Friend
              </h5>
              <Form onSubmit={handleSendRequest}>
                <Form.Group className="mb-3">
                  <Form.Label>Friend's Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="friend@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading || !friendEmail.trim()}
                >
                  <UserPlus size={18} className="me-2" />
                  Send Request
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">
                <Mail className="me-2" size={20} />
                Friend Requests
                {friendRequests.length > 0 && (
                  <Badge bg="danger" className="ms-2">{friendRequests.length}</Badge>
                )}
              </h5>
              {friendRequests.length === 0 ? (
                <p className="text-muted mb-0">No pending friend requests</p>
              ) : (
                <ListGroup>
                  {friendRequests.map((request) => (
                    <ListGroup.Item key={request.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Friend request</strong>
                        <div className="small text-muted">From: {request.fromUserId}</div>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="success"
                          className="me-2"
                          onClick={() => handleAccept(request.id, request.fromUserId)}
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReject(request.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
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
                <Users className="me-2" size={20} />
                My Friends
                <Badge bg="primary" className="ms-2">{friends.length}</Badge>
              </h5>
              {friends.length === 0 ? (
                <p className="text-muted mb-0">No friends yet. Send a friend request to get started!</p>
              ) : (
                <ListGroup>
                  {friends.map((friendId) => (
                    <ListGroup.Item key={friendId} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>User: {friendId}</strong>
                        <div className="small text-muted">Connected</div>
                      </div>
                      <Badge bg="success">Friend</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Friends;
