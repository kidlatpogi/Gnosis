import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Alert } from 'react-bootstrap';
import { UserPlus, Users, Check, X, Mail, Bell, Copy, UserMinus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listenToFriendRequests,
  listenToFriends,
  getUserInfo,
  removeFriend
} from '../lib/db';
import UnfriendModal from '../components/UnfriendModal';

function Friends() {
  const { user } = useAuth();
  const [friendCode, setFriendCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsWithDetails, setFriendRequestsWithDetails] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsWithDetails, setFriendsWithDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [listenerError, setListenerError] = useState(null);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const [friendToUnfriend, setFriendToUnfriend] = useState(null);

  useEffect(() => {
    if (!user || !user.uid) {
      console.log('⏳ Waiting for user authentication...');
      return;
    }

    // Fetch user's own code
    const fetchUserCode = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserCode(userSnap.data().userCode);
        }
      } catch (error) {
        console.error('Error fetching user code:', error);
      }
    };

    fetchUserCode();

    console.log('📡 Setting up listeners for user:', user.uid);
    setListenerError(null);

    // Set up real-time listener for friend requests
    const unsubscribeRequests = listenToFriendRequests(user.uid, (requests) => {
      console.log('📨 Friend requests updated:', requests.length);
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
      console.log('👥 Friends list updated:', friendsList.length);
      setFriends(friendsList);

      // Fetch details for each friend
      Promise.all(
        friendsList.map(async (friendId) => {
          const friendInfo = await getUserInfo(friendId);
          return {
            uid: friendId,
            email: friendInfo?.email || 'Unknown',
            displayName: friendInfo?.displayName || 'Unknown User'
          };
        })
      ).then(setFriendsWithDetails);
    });

    // Also fetch details for friend requests
    const fetchRequestDetails = async () => {
      const details = await Promise.all(
        friendRequests.map(async (request) => {
          if (!request.fromUserId) return request;
          const userInfo = await getUserInfo(request.fromUserId);
          return {
            ...request,
            fromUserEmail: userInfo?.email || 'Unknown',
            fromUserName: userInfo?.displayName || 'Unknown User'
          };
        })
      );
      setFriendRequestsWithDetails(details);
    };

    if (friendRequests.length > 0) {
      fetchRequestDetails();
    } else {
      setFriendRequestsWithDetails([]);
    }

    // Cleanup listeners on unmount
    return () => {
      console.log('🔌 Cleaning up listeners');
      unsubscribeRequests();
      unsubscribeFriends();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Separate useEffect to fetch friend request details when requests array changes
  useEffect(() => {
    if (friendRequests.length === 0) {
      setFriendRequestsWithDetails([]);
      return;
    }

    const fetchRequestDetails = async () => {
      const details = await Promise.all(
        friendRequests.map(async (request) => {
          if (!request.fromUserId) return request;
          const userInfo = await getUserInfo(request.fromUserId);
          return {
            ...request,
            fromUserEmail: userInfo?.email || 'Unknown',
            fromUserName: userInfo?.displayName || 'Unknown User'
          };
        })
      );
      setFriendRequestsWithDetails(details);
    };

    fetchRequestDetails();
  }, [friendRequests]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!friendCode.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (friendCode === userCode) {
        setMessage({ type: 'danger', text: 'You cannot add yourself as a friend!' });
        setLoading(false);
        return;
      }

      await sendFriendRequest(user.uid, userCode, friendCode.trim());
      setMessage({ type: 'success', text: `Friend request sent!` });
      setFriendCode('');
    } catch (error) {
      const errorMsg = error.message || 'Failed to send friend request. Try again.';
      setMessage({ type: 'danger', text: errorMsg });
      console.error('Error sending friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, friendId) => {
    setLoading(true);
    try {
      console.log('Accepting request:', { requestId, userId: user.uid, friendId });
      await acceptFriendRequest(requestId, user.uid, friendId);
      setMessage({ type: 'success', text: 'Friend request accepted!' });
      setNewRequestCount(0);
    } catch (error) {
      const errorMsg = error.message || 'Failed to accept request. Please try again.';
      setMessage({ type: 'danger', text: errorMsg });
      console.error('Error accepting friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    setLoading(true);
    try {
      await rejectFriendRequest(requestId);
      setMessage({ type: 'info', text: 'Friend request rejected.' });
      setNewRequestCount(0);
    } catch (error) {
      const errorMsg = error.message || 'Failed to reject request. Please try again.';
      setMessage({ type: 'danger', text: errorMsg });
      console.error('Error rejecting friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriendClick = (friend) => {
    setFriendToUnfriend(friend);
    setShowUnfriendModal(true);
  };

  const handleConfirmUnfriend = async () => {
    if (!friendToUnfriend) return;

    setLoading(true);
    try {
      await removeFriend(user.uid, friendToUnfriend.uid);
      setMessage({ type: 'info', text: `${friendToUnfriend.displayName} has been removed from your friends list.` });
      setShowUnfriendModal(false);
      setFriendToUnfriend(null);
    } catch (error) {
      const errorMsg = error.message || 'Failed to remove friend. Please try again.';
      setMessage({ type: 'danger', text: errorMsg });
      console.error('Error removing friend:', error);
    } finally {
      setLoading(false);
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
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          <Card style={{ minHeight: '220px' }}>
            <Card.Body>
              <h5 className="mb-3" style={{ fontSize: '0.9rem' }}>
                <UserPlus className="me-2" size={20} />
                Your Code
              </h5>
              <div className="d-flex gap-2 mb-3">
                <Form.Control
                  type="text"
                  value={userCode}
                  readOnly
                  style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}
                />
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(userCode);
                    setMessage({ type: 'info', text: 'Code copied!' });
                  }}
                  disabled={!userCode}
                >
                  <Copy size={18} />
                </Button>
              </div>
              <p className="text-muted small mb-0">Share this code with friends to connect</p>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card style={{ minHeight: '220px' }}>
            <Card.Body>
              <h5 className="mb-3">
                <UserPlus className="me-2" size={20} />
                Add Friend
              </h5>
              <Form onSubmit={handleSendRequest}>
                <Form.Group className="mb-3">
                  <Form.Label>Friend's Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value)}
                    disabled={loading}
                    maxLength="6"
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !friendCode.trim()}
                >
                  <UserPlus size={18} className="me-2" />
                  Send Request
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          <Card style={{ minHeight: '200px' }}>
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
                  {friendRequestsWithDetails.map((request) => (
                    <ListGroup.Item key={request.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{request.fromUserName}</strong>
                        <div className="small text-muted">{request.fromUserEmail}</div>
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

        <Col xs={12} lg={6}>
          <Card style={{ minHeight: '200px' }}>
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
                  {friendsWithDetails.map((friend) => (
                    <ListGroup.Item key={friend.uid} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{friend.displayName}</strong>
                        <div className="small text-muted">{friend.email}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleUnfriendClick(friend)}
                        disabled={loading}
                      >
                        <UserMinus size={16} className="me-1" />
                        Unfriend
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <UnfriendModal
        show={showUnfriendModal}
        onHide={() => setShowUnfriendModal(false)}
        friend={friendToUnfriend}
        onConfirm={handleConfirmUnfriend}
        loading={loading}
      />
    </Container>
  );
}

export default Friends;
