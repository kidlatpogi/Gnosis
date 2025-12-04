import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createDeck } from '../lib/db';

const CreateDeck = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !subject.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const deckData = {
        title: title.trim(),
        subject: subject.trim(),
        cards: [] // Start with empty cards array
      };

      const deckId = await createDeck(user.uid, deckData);
      
      // Navigate to add cards page
      navigate(`/deck/${deckId}/add-cards`);
    } catch (err) {
      console.error('Error creating deck:', err);
      setError(err.message || 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem', background: '#ffffff' }}>
      <Container style={{ maxWidth: '700px' }}>
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
            Create New Deck
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Step 1: Set up your deck details
          </p>
        </div>

        {/* Form Card */}
        <Card className="glass-card shadow-xl rounded-4 p-4">
          <Card.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold" style={{ fontSize: '1.1rem' }}>
                  Deck Title
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Spanish Vocabulary, Biology Chapter 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="lg"
                  required
                  style={{ fontSize: '1.1rem' }}
                />
                <Form.Text className="text-muted">
                  Give your deck a descriptive name
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold" style={{ fontSize: '1.1rem' }}>
                  Subject
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Language, Science, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  size="lg"
                  required
                  style={{ fontSize: '1.1rem' }}
                />
                <Form.Text className="text-muted">
                  Category or subject area
                </Form.Text>
              </Form.Group>

              <div className="d-flex gap-3 justify-content-end mt-4">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                  disabled={loading}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  size="lg"
                  disabled={loading || !title.trim() || !subject.trim()}
                  className="d-flex align-items-center gap-2 px-4"
                >
                  {loading ? 'Creating...' : (
                    <>
                      <Save size={20} />
                      Continue to Add Cards
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <div className="mt-4 text-center">
          <small className="text-muted">
            💡 After creating your deck, you'll be able to add flashcards one by one
          </small>
        </div>
      </Container>
    </div>
  );
};

export default CreateDeck;
