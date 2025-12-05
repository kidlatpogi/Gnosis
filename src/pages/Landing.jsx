import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { Brain, Zap, Target, TrendingUp, BookOpen, Heart } from 'lucide-react';
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
                  <h4 className="fw-bold mb-3">Smart Algorithm</h4>
                  <p className="text-muted">
                    Our SM-2 spaced repetition algorithm adapts to your learning 
                    pace, showing you cards exactly when you need to review them.
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
                  <h4 className="fw-bold mb-3">Mastery Tracking</h4>
                  <p className="text-muted">
                    Track your progress with visual mastery indicators. Watch as 
                    your knowledge solidifies through strategic review sessions.
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
                  <h4 className="fw-bold mb-3">Unlimited Decks</h4>
                  <p className="text-muted">
                    Create unlimited decks for any subject. Organize your learning 
                    materials the way that works best for you.
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
                  <h4 className="fw-bold mb-3">Unlimited Hearts</h4>
                  <p className="text-muted">
                    Learn at your own pace without restrictions. No lives to lose, 
                    no paywalls—just pure, uninterrupted learning.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-warning">
                    <TrendingUp size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Performance Analytics</h4>
                  <p className="text-muted">
                    Monitor your learning journey with detailed statistics and 
                    insights about your study patterns and retention rates.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3 text-secondary">
                    <Brain size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Hints & Support</h4>
                  <p className="text-muted">
                    Stuck on a card? Get unlimited hints to guide your learning 
                    without breaking your study flow.
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
