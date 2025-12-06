import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavigationBar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Study from './pages/Study';
import CreateDeck from './pages/CreateDeck';
import AddCards from './pages/AddCards';
import Friends from './pages/Friends';
import SharedDecks from './pages/SharedDecks';
import Leaderboard from './pages/Leaderboard';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Container fluid className="min-vh-100 d-flex flex-column p-0">
          <NavigationBar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/study/:deckId" 
              element={
                <ProtectedRoute>
                  <Study />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-deck" 
              element={
                <ProtectedRoute>
                  <CreateDeck />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/deck/:deckId/add-cards" 
              element={
                <ProtectedRoute>
                  <AddCards />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/friends" 
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared-decks" 
              element={
                <ProtectedRoute>
                  <SharedDecks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;
