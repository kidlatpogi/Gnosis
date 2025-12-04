import { Container, Card, Button, Alert } from 'react-bootstrap';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const { user, signInWithGoogle, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Container 
      className="d-flex justify-content-center align-items-center" 
      style={{ minHeight: '100vh' }}
    >
      <Card className="shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-5 text-center">
          <div className="mb-4">
            <h1 className="display-3 mb-2">🧠</h1>
            <h2 className="fw-bold mb-3">Gnosis</h2>
            <p className="text-muted">
              Master knowledge through intelligent spaced repetition
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <div className="mb-4">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              onClick={handleGoogleSignIn}
            >
              <LogIn size={20} />
              Sign in with Google
            </Button>
          </div>

          <div className="text-muted">
            <small>
              <strong>Why login?</strong>
              <br />
              Save your progress and track mastery across all your devices
            </small>
          </div>

          <hr className="my-4" />

          <div className="text-start">
            <h6 className="fw-bold mb-3">Features:</h6>
            <ul className="text-muted small">
              <li>Unlimited hearts - learn at your own pace</li>
              <li>Smart spaced repetition algorithm</li>
              <li>Track your mastery progress</li>
              <li>Unlimited hints when you need help</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
