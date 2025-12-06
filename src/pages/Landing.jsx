import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { Brain, Zap, Target, TrendingUp, BookOpen, Heart, Volume2, Shuffle, Repeat2, Lightbulb, Users, Share2, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6} className="text-center text-lg-start mb-5 mb-lg-0">
              <div className="d-flex align-items-center justify-content-center justify-content-lg-start mb-4">
                <Brain size={64} className="me-3" />
                <h1 className="display-3 fw-bold mb-0">Gnosis</h1>
              </div>
              <p className="lead fs-3 mb-4">
                Master any subject with intelligent spaced repetition
              </p>
              <p className="fs-5 mb-4 opacity-90">
                Transform the way you learn. Gnosis uses proven cognitive science 
                to help you remember more, study less, and achieve mastery faster.
              </p>
              <Button 
                variant="light" 
                size="lg" 
                className="px-5 py-3 fw-bold shadow"
                onClick={() => navigate('/login')}
              >
                Get Started Free
              </Button>
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <Brain size={300} className="opacity-75" strokeWidth={1} />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Why Choose Gnosis?</h2>
            <p className="lead text-muted">
              Powerful features designed to optimize your learning experience
            </p>
          </div>

          <Row className="g-4">
            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-primary">
                    <Zap size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Smart SM-2 Algorithm</h4>
                  <p className="text-muted">
                    Our advanced spaced repetition algorithm adapts to your learning pace, showing you cards exactly when you need to review them.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-success">
                    <Repeat2 size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Multi-Round Sessions</h4>
                  <p className="text-muted">
                    Study until mastery! Cards marked incorrect automatically enter a retry round. Keep learning until perfect recall.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-info">
                    <Shuffle size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Randomized Cards</h4>
                  <p className="text-muted">
                    Each study session randomizes card orientation. Remember the answer, not the position. True learning, not memorization.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-danger">
                    <Volume2 size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Brain-Triggering Sounds</h4>
                  <p className="text-muted">
                    Get exciting audio feedback on correct answers. Toggle sounds on/off anytime. Multi-sensory learning boost!
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-warning">
                    <Lightbulb size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Harder Multiple Choice</h4>
                  <p className="text-muted">
                    Challenge yourself with intelligent distractors! Our system generates contextually similar wrong answers for deeper learning.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-secondary">
                    <TrendingUp size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">GitHub-Style Heatmap</h4>
                  <p className="text-muted">
                    Visualize your study consistency with a 365-day activity heatmap. Watch your learning streak grow day by day.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-info">
                    <BookOpen size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Multiple Study Modes</h4>
                  <p className="text-muted">
                    Choose how you learn: Flashcard mode, Multiple Choice, or Type-to-Answer. Mix and match for maximum retention.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-success">
                    <Target size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Instant Mastery Feedback</h4>
                  <p className="text-muted">
                    Simple Correct/Incorrect rating system. No overthinking—focus on learning what matters most.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-primary">
                    <Users size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Friends & Collaboration</h4>
                  <p className="text-muted">
                    Connect with friends, share your study decks, and learn together. Build your learning community!
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-warning">
                    <Share2 size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Share Decks</h4>
                  <p className="text-muted">
                    Share your carefully crafted study decks with friends. Import decks shared with you instantly!
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-success">
                    <Trophy size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Leaderboards</h4>
                  <p className="text-muted">
                    Compete with friends on study time and cards solved. Friendly competition drives motivation!
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-danger">
                    <Heart size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Free & Unlimited</h4>
                  <p className="text-muted">
                    Create unlimited decks with unlimited cards. No paywalls, no restrictions, no credit card needed.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="lead text-muted">
              Get started in three simple steps
            </p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <div className="text-center">
                <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: 'bold' }}>
                  1
                </div>
                <h4 className="fw-bold mb-3">Create Your Decks</h4>
                <p className="text-muted">
                  Add flashcards on any topic you want to master. From languages 
                  to science, history to programming—the sky's the limit.
                </p>
              </div>
            </Col>

            <Col md={4}>
              <div className="text-center">
                <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: 'bold' }}>
                  2
                </div>
                <h4 className="fw-bold mb-3">Study Smart</h4>
                <p className="text-muted">
                  Our intelligent algorithm schedules reviews at optimal intervals, 
                  reinforcing your memory right before you forget.
                </p>
              </div>
            </Col>

            <Col md={4}>
              <div className="text-center">
                <div className="rounded-circle bg-info text-white d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: 'bold' }}>
                  3
                </div>
                <h4 className="fw-bold mb-3">Track Progress</h4>
                <p className="text-muted">
                  Watch your mastery grow as concepts move from new to learned. 
                  Celebrate your achievements along the way!
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section bg-primary text-white py-5">
        <Container>
          <div className="text-center py-5">
            <h2 className="display-4 fw-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="lead fs-4 mb-4">
              Join thousands of learners who are mastering knowledge faster with Gnosis
            </p>
            <Button 
              variant="light" 
              size="lg" 
              className="px-5 py-3 fw-bold shadow"
              onClick={() => navigate('/login')}
            >
              Start Learning Now
            </Button>
            <p className="mt-3 opacity-75">
              <small>Free forever. No credit card required.</small>
            </p>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <div className="text-center">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <Brain size={24} className="me-2" />
              <span className="fw-bold">Gnosis</span>
            </div>
            <p className="text-muted small mb-0">
              © 2025 Gnosis. Master knowledge through intelligent spaced repetition.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Landing;
