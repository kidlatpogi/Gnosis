import { Row, Col, Card, Button, Badge, ButtonGroup } from 'react-bootstrap';
import { BookOpen, Clock, TrendingUp, Edit2 } from 'lucide-react';

const DeckList = ({ decks, deckStats, onStudy, onEdit }) => {
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
                <ButtonGroup className="w-100">
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
                    style={{ 
                      flex: '1 1 70%',
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
                  <Button 
                    variant="outline-dark"
                    onClick={() => onEdit && onEdit(deck)}
                    style={{ 
                      flex: '1 1 30%',
                      fontWeight: 600
                    }}
                  >
                    <Edit2 size={18} />
                  </Button>
                </ButtonGroup>

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
  );
};

export default DeckList;
