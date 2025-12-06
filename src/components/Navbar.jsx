import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { BookOpen, LogOut, User, Brain, Users, Trophy, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-sticky">
      <Container>
        <Navbar.Brand 
          onClick={() => navigate(user ? '/dashboard' : '/')} 
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center gap-2 fw-bold"
        >
          <Brain size={32} />
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Gnosis</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            {user ? (
              <>
                <Nav.Link onClick={() => navigate('/dashboard')}>
                  <BookOpen size={18} className="me-2" />
                  Dashboard
                </Nav.Link>
                
                <Nav.Link onClick={() => navigate('/friends')}>
                  <Users size={18} className="me-2" />
                  Friends
                </Nav.Link>
                
                <Nav.Link onClick={() => navigate('/shared-decks')}>
                  <Share2 size={18} className="me-2" />
                  Shared Decks
                </Nav.Link>
                
                <Nav.Link onClick={() => navigate('/leaderboard')}>
                  <Trophy size={18} className="me-2" />
                  Leaderboard
                </Nav.Link>
                
                <Dropdown align="end" className="ms-3">
                  <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                    <User size={18} className="me-2" />
                    {user.displayName || 'Account'}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.ItemText>
                      <small className="text-muted">{user.email}</small>
                    </Dropdown.ItemText>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleSignOut}>
                      <LogOut size={16} className="me-2" />
                      Sign Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <Button 
                variant="outline-light" 
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
