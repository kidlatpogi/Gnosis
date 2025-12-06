import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

// Helper function to generate unique 6-digit code
function generateUserCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to check if code exists
async function codeExists(code) {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    for (const doc of querySnapshot.docs) {
      if (doc.data().userCode === code) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking code:', error);
    return false;
  }
}

// Generate a unique code
async function getUniqueCode() {
  let code = generateUserCode();
  let attempts = 0;
  
  while (await codeExists(code) && attempts < 10) {
    code = generateUserCode();
    attempts++;
  }
  
  return code;
}

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);
          
          // Create or update user profile in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // Generate unique code for new user
            const userCode = await getUniqueCode();
            
            // Create new user profile
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              userCode: userCode,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            });
            
            console.log('✅ New user created with code:', userCode);
          } else {
            // Check if existing user has a userCode, if not, generate one
            const userData = userSnap.data();
            if (!userData.userCode) {
              const userCode = await getUniqueCode();
              await setDoc(userRef, {
                userCode: userCode,
                lastLogin: new Date().toISOString()
              }, { merge: true });
              console.log('✅ Generated code for existing user:', userCode);
            } else {
              // Update last login only
              await setDoc(userRef, {
                lastLogin: new Date().toISOString()
              }, { merge: true });
            }
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
