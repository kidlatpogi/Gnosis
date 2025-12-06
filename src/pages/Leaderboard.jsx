import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Tab, Tabs } from 'react-bootstrap';
import { Trophy, Clock, CheckSquare, Medal, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getFriends, 
  getStudyTimeLeaderboard, 
  getCardsSolvedLeaderboard 
} from '../lib/db';

function Leaderboard() {
  const { user } = useAuth();
  const [studyTimeLeaderboard, setStudyTimeLeaderboard] = useState([]);
  const [cardsSolvedLeaderboard, setCardsSolvedLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeaderboards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      // Get friends and include current user
      const friendIds = await getFriends(user.uid);
      const allUserIds = [user.uid, ...friendIds];

      // Load both leaderboards
      const [studyTime, cardsSolved] = await Promise.all([
        getStudyTimeLeaderboard(allUserIds),
        getCardsSolvedLeaderboard(allUserIds)
      ]);

      setStudyTimeLeaderboard(studyTime);
      setCardsSolvedLeaderboard(cardsSolved);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return <Medal size={24} className="text-warning" />;
    if (index === 1) return <Medal size={24} className="text-secondary" />;
    if (index === 2) return <Medal size={24} className="text-danger" />;
    return <span className="text-muted fw-bold">#{index + 1}</span>;
  };

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderLeaderboardItem = (item, index, type) => {
    const isCurrentUser = item.userId === user.uid;
    const value = type === 'time' ? formatMinutes(item.totalMinutes) : `${item.totalCards} cards`;

    return (
      <ListGroup.Item 
        key={item.userId}
        className={`d-flex justify-content-between align-items-center ${isCurrentUser ? 'bg-light' : ''}`}
      >
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: '40px', textAlign: 'center' }}>
            {getRankBadge(index)}
          </div>
          <div>
            <strong>{isCurrentUser ? 'You' : `User: ${item.userId.substring(0, 8)}...`}</strong>
            {isCurrentUser && <Badge bg="primary" className="ms-2">You</Badge>}
          </div>
        </div>
        <div className="text-end">
          <strong className="fs-5">{value}</strong>
        </div>
      </ListGroup.Item>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 mb-2">
            <Trophy className="me-3" size={48} />
            Leaderboard
          </h1>
          <p className="text-muted">Compete with friends and track your progress</p>
        </Col>
      </Row>

      {studyTimeLeaderboard.length === 0 && cardsSolvedLeaderboard.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <Award size={64} className="text-muted mb-3" />
            <h3>No data yet</h3>
            <p className="text-muted">
              Add friends and start studying to see the leaderboard!
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Tabs defaultActiveKey="studytime" className="mb-4">
          <Tab 
            eventKey="studytime" 
            title={
              <span>
                <Clock size={18} className="me-2" />
                Study Time
              </span>
            }
          >
            <Card>
              <Card.Body>
                <h5 className="mb-3">
                  <Clock className="me-2" size={20} />
                  Most Study Time
                </h5>
                <ListGroup>
                  {studyTimeLeaderboard.map((item, index) => 
                    renderLeaderboardItem(item, index, 'time')
                  )}
                </ListGroup>
                {studyTimeLeaderboard.length === 0 && (
                  <p className="text-muted text-center mb-0">No study sessions recorded yet</p>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab 
            eventKey="cards" 
            title={
              <span>
                <CheckSquare size={18} className="me-2" />
                Cards Solved
              </span>
            }
          >
            <Card>
              <Card.Body>
                <h5 className="mb-3">
                  <CheckSquare className="me-2" size={20} />
                  Most Cards Solved
                </h5>
                <ListGroup>
                  {cardsSolvedLeaderboard.map((item, index) => 
                    renderLeaderboardItem(item, index, 'cards')
                  )}
                </ListGroup>
                {cardsSolvedLeaderboard.length === 0 && (
                  <p className="text-muted text-center mb-0">No cards solved yet</p>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}

      <Row className="mt-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="mb-2">
                <Trophy className="me-2" size={18} />
                How Rankings Work
              </h6>
              <ul className="mb-0 small text-muted">
                <li><strong>Study Time:</strong> Total minutes spent studying across all sessions</li>
                <li><strong>Cards Solved:</strong> Total number of unique cards you've practiced</li>
                <li>Rankings update in real-time as you and your friends study</li>
                <li>Add more friends to expand your leaderboard</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Leaderboard;
