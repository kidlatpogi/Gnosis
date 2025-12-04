// Utility script to seed Firestore with sample decks
// To use: 
// 1. Make sure Firebase config is updated in src/lib/firebase.js
// 2. Run the app (npm run dev)
// 3. Open the Login page and sign in with Google
// 4. Open browser console and run: seedSampleDecks()

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const sampleDecks = [
  {
    id: 'react-basics',
    title: 'React Basics',
    subject: 'Programming',
    cards: [
      {
        id: 'react-1',
        front: 'What is JSX?',
        back: 'JSX is a syntax extension for JavaScript that looks similar to HTML. It allows you to write HTML-like code in your JavaScript files.'
      },
      {
        id: 'react-2',
        front: 'What is a React component?',
        back: 'A React component is a reusable piece of UI that can accept props and return React elements describing what should appear on the screen.'
      },
      {
        id: 'react-3',
        front: 'What is the difference between props and state?',
        back: 'Props are read-only data passed from parent to child components. State is internal, mutable data managed within a component.'
      },
      {
        id: 'react-4',
        front: 'What is the useState hook?',
        back: 'useState is a React hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.'
      },
      {
        id: 'react-5',
        front: 'What is the useEffect hook used for?',
        back: 'useEffect lets you perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.'
      }
    ]
  },
  {
    id: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals',
    subject: 'Programming',
    cards: [
      {
        id: 'js-1',
        front: 'What is closure in JavaScript?',
        back: 'A closure is a function that has access to variables in its outer (enclosing) scope, even after the outer function has returned.'
      },
      {
        id: 'js-2',
        front: 'What is the difference between let, const, and var?',
        back: 'var is function-scoped and can be redeclared. let is block-scoped and can be reassigned. const is block-scoped and cannot be reassigned.'
      },
      {
        id: 'js-3',
        front: 'What is a Promise?',
        back: 'A Promise is an object representing the eventual completion or failure of an asynchronous operation and its resulting value.'
      },
      {
        id: 'js-4',
        front: 'What does async/await do?',
        back: 'async/await is syntactic sugar for Promises, making asynchronous code look and behave more like synchronous code.'
      },
      {
        id: 'js-5',
        front: 'What is the spread operator?',
        back: 'The spread operator (...) expands an iterable (like an array) into individual elements, useful for copying arrays or passing multiple arguments.'
      }
    ]
  },
  {
    id: 'firebase-basics',
    title: 'Firebase Basics',
    subject: 'Backend',
    cards: [
      {
        id: 'firebase-1',
        front: 'What is Firestore?',
        back: 'Firestore is a NoSQL document database that stores data in collections of documents, providing real-time synchronization.'
      },
      {
        id: 'firebase-2',
        front: 'What is Firebase Authentication?',
        back: 'Firebase Authentication provides backend services to authenticate users using passwords, phone numbers, or federated identity providers like Google.'
      },
      {
        id: 'firebase-3',
        front: 'What are Firestore Security Rules?',
        back: 'Security Rules define who has read and write access to your database, protecting your data from unauthorized access.'
      },
      {
        id: 'firebase-4',
        front: 'What is a Firestore collection?',
        back: 'A collection is a container for documents in Firestore. Each collection is identified by a name and contains multiple documents.'
      },
      {
        id: 'firebase-5',
        front: 'What is real-time listening in Firestore?',
        back: 'Real-time listeners allow your app to receive updates whenever data changes in Firestore, without manually refreshing.'
      }
    ]
  }
];

export async function seedSampleDecks() {
  try {
    console.log('🌱 Starting to seed decks...');
    
    for (const deck of sampleDecks) {
      await setDoc(doc(db, 'decks', deck.id), deck);
      console.log(`✅ Seeded deck: ${deck.title} (${deck.cards.length} cards)`);
    }
    
    console.log('🎉 All decks seeded successfully!');
    console.log(`📚 Total: ${sampleDecks.length} decks`);
    return { success: true, count: sampleDecks.length };
  } catch (error) {
    console.error('❌ Error seeding decks:', error);
    return { success: false, error: error.message };
  }
}

// Make function available globally in browser console
if (typeof window !== 'undefined') {
  window.seedSampleDecks = seedSampleDecks;
}

export default sampleDecks;
