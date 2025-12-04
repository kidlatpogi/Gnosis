import { useState, useEffect } from 'react';
import { Card, Button, Badge, Form, ButtonGroup, ProgressBar, Alert } from 'react-bootstrap';
import { Eye, Lightbulb, Check, X, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * StudyCard Component - Enhanced with multiple study modes, hints, and celebrations
 */
const StudyCard = ({ card, onRate, cardsRemaining, currentIndex = 0, totalCards = 1, allCards = [] }) => {
  const [studyMode, setStudyMode] = useState('flashcard');
  const [isFlipped, setIsFlipped] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [mcOptions, setMcOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [autoRated, setAutoRated] = useState(false);
  
  // Type answer hint system
  const [revealedLetters, setRevealedLetters] = useState([]);
  const [blankTemplate, setBlankTemplate] = useState('');
  
  // Multiple choice hint system
  const [removedOptions, setRemovedOptions] = useState([]);

  // Levenshtein distance for fuzzy string matching
  const levenshteinDistance = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    const matrix = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[s2.length][s1.length];
  };

  const checkSimilarity = (input, correct) => {
    const distance = levenshteinDistance(input, correct);
    const maxLength = Math.max(input.length, correct.length);
    const similarity = 1 - distance / maxLength;
    return similarity >= 0.8;
  };

  // Generate similar words for multiple choice using word similarity
  const generateSimilarOptions = () => {
    if (!card) return [];
    
    const correctAnswer = card.back.toLowerCase();
    const correctWords = correctAnswer.split(' ');
    
    // Get all possible answers from other cards
    const otherAnswers = allCards
      .filter(c => c.id !== card.id)
      .map(c => c.back);
    
    let wrongOptions = [];
    
    if (otherAnswers.length > 0) {
      // Score each answer by similarity
      const scoredAnswers = otherAnswers.map(answer => {
        const answerWords = answer.toLowerCase().split(' ');
        let score = 0;
        
        // Same number of words bonus
        if (answerWords.length === correctWords.length) score += 3;
        
        // Shared words bonus
        const sharedWords = answerWords.filter(w => correctWords.includes(w)).length;
        score += sharedWords * 5;
        
        // Similar length bonus
        const lengthDiff = Math.abs(answer.length - card.back.length);
        if (lengthDiff < 5) score += 2;
        else if (lengthDiff < 10) score += 1;
        
        // First letter match bonus
        if (answer[0].toLowerCase() === card.back[0].toLowerCase()) score += 2;
        
        return { answer, score };
      });
      
      // Sort by score and take top 3
      scoredAnswers.sort((a, b) => b.score - a.score);
      wrongOptions = scoredAnswers.slice(0, 3).map(s => s.answer);
      
      // If we don't have enough similar options, fill with random
      while (wrongOptions.length < 3 && wrongOptions.length < otherAnswers.length) {
        const randomAnswer = otherAnswers[Math.floor(Math.random() * otherAnswers.length)];
        if (!wrongOptions.includes(randomAnswer)) {
          wrongOptions.push(randomAnswer);
        }
      }
    }
    
    // If still not enough options (e.g., only 1 card in deck), generate contextual wrong answers
    if (wrongOptions.length < 3) {
      const generateWrongAnswer = () => {
        const words = card.back.split(' ');
        
        // Strategy 1: Modify the correct answer slightly
        if (words.length === 1) {
          // Single word - add prefix/suffix or change slightly
          const variations = [
            `Not ${card.back}`,
            `${card.back} (incorrect)`,
            `Fake ${card.back}`,
            `Wrong ${card.back}`,
            `${card.back}s`,
            `${card.back.slice(0, -1)}`,
          ];
          return variations[Math.floor(Math.random() * variations.length)];
        } else {
          // Multiple words - shuffle or swap words
          const shuffled = [...words].sort(() => Math.random() - 0.5).join(' ');
          if (shuffled !== card.back) return shuffled;
          
          // Swap first two words
          if (words.length >= 2) {
            return `${words[1]} ${words[0]}${words.length > 2 ? ' ' + words.slice(2).join(' ') : ''}`;
          }
        }
        return `Incorrect: ${card.back}`;
      };
      
      const attempts = new Set();
      while (wrongOptions.length < 3 && attempts.size < 20) {
        const wrong = generateWrongAnswer();
        if (wrong !== card.back && !wrongOptions.includes(wrong)) {
          wrongOptions.push(wrong);
        }
        attempts.add(wrong);
      }
      
      // Fallback if still not enough
      const fallbacks = [
        `Incorrect answer`,
        `Wrong choice`,
        `Not the answer`
      ];
      
      while (wrongOptions.length < 3) {
        const fallback = fallbacks[wrongOptions.length];
        if (fallback && !wrongOptions.includes(fallback)) {
          wrongOptions.push(fallback);
        }
      }
    }
    
    // Shuffle correct answer with wrong options
    const options = [...wrongOptions.slice(0, 3), card.back].sort(() => Math.random() - 0.5);
    return options;
  };

  // Create blank template for type answer hint
  const createBlankTemplate = (text) => {
    return text.split('').map((char, idx) => {
      if (char === ' ') return ' ';
      if (revealedLetters.includes(idx)) return char;
      return '_';
    }).join(' ');
  };

  // Initialize state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setHintShown(false);
    setHintUsed(false);
    setTypedAnswer('');
    setFeedback(null);
    setSelectedOption(null);
    setAutoRated(false);
    setRevealedLetters([]);
    setRemovedOptions([]);

    // Initialize blank template for type answer
    if (card?.back && studyMode === 'type-answer') {
      setBlankTemplate(createBlankTemplate(card.back));
    }

    // Initialize multiple choice options
    if (studyMode === 'multiple-choice' && card && allCards.length >= 1) {
      const options = generateSimilarOptions();
      setMcOptions(options);
    }
  }, [card, studyMode, allCards]);

  // Update blank template when revealed letters change
  useEffect(() => {
    if (card?.back && studyMode === 'type-answer') {
      setBlankTemplate(createBlankTemplate(card.back));
    }
  }, [revealedLetters]);

  // Celebration animation
  const celebrate = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      }));
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      }));
    }, 250);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShowHint = () => {
    if (card?.hint) {
      setHintShown(true);
      setHintUsed(true);
    }
  };

  // Type answer hint - reveal one letter
  const handleTypeHint = () => {
    if (!card?.back) return;
    
    setHintUsed(true);
    const letterIndices = card.back.split('').map((char, idx) => char !== ' ' ? idx : -1).filter(i => i >= 0);
    const unrevealed = letterIndices.filter(idx => !revealedLetters.includes(idx));
    
    if (unrevealed.length > 0) {
      const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      const newRevealedLetters = [...revealedLetters, randomIdx];
      setRevealedLetters(newRevealedLetters);
      
      // Check if all letters are revealed
      if (newRevealedLetters.length >= letterIndices.length) {
        // Auto-fail when all letters revealed
        setFeedback({
          correct: false,
          message: `❌ All letters revealed! The answer was: ${card.back}`
        });
        
        if (!autoRated) {
          setTimeout(() => {
            setAutoRated(true);
            onRate(1, true); // Quality 1 (Again) with hint used
          }, 2000);
        }
      }
    }
  };

  // Multiple choice hint - remove one wrong answer
  const handleMCHint = () => {
    setHintUsed(true);
    const wrongOptions = mcOptions.filter(opt => opt !== card.back && !removedOptions.includes(opt));
    
    if (wrongOptions.length > 0) {
      const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      setRemovedOptions([...removedOptions, toRemove]);
    }
  };

  const handleMCSelection = (option) => {
    setSelectedOption(option);
    const isCorrect = option === card.back;
    
    setFeedback({
      correct: isCorrect,
      message: isCorrect ? '✅ Correct! Well done!' : `❌ Wrong! The answer was: ${card.back}`
    });
    
    if (isCorrect) {
      celebrate();
    }
    
    if (!autoRated) {
      const quality = isCorrect ? (hintUsed ? 2 : 3) : 1;
      setTimeout(() => {
        setAutoRated(true);
        onRate(quality, hintUsed);
      }, 2000);
    }
  };

  const handleSubmitTyped = (e) => {
    if (e) e.preventDefault();
    if (!typedAnswer.trim()) return;
    
    const isCorrect = checkSimilarity(typedAnswer, card.back);
    setFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? '✅ Correct! Great job!' 
        : `❌ Wrong! The answer was: ${card.back}`
    });
    
    if (isCorrect) {
      celebrate();
    }
    
    if (!autoRated) {
      const quality = isCorrect ? (hintUsed ? 2 : 3) : 1;
      setTimeout(() => {
        setAutoRated(true);
        onRate(quality, hintUsed);
      }, 2000);
    }
  };

  const handleRate = (quality) => {
    onRate(quality, hintUsed);
    // Reset for next card
    setIsFlipped(false);
    setHintUsed(false);
    setHintShown(false);
    setRevealedLetters([]);
    setRemovedOptions([]);
  };

  const handleModeChange = (mode) => {
    setStudyMode(mode);
    setIsFlipped(false);
    setHintShown(false);
    setHintUsed(false);
    setTypedAnswer('');
    setFeedback(null);
    setSelectedOption(null);
    setAutoRated(false);
    setRevealedLetters([]);
    setRemovedOptions([]);
  };

  if (!card) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Card className="text-center p-5 shadow-lg rounded-3" style={{ border: '2px solid #000' }}>
          <Card.Body>
            <h3 className="mb-4">🎉 Session Complete!</h3>
            <p className="text-muted">You've reviewed all cards for today.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / totalCards) * 100;
  const availableOptions = mcOptions.filter(opt => !removedOptions.includes(opt));

  return (
    <div className="d-flex flex-column align-items-center gap-4" style={{ minHeight: '500px', width: '100%' }}>
      {/* Progress Bar */}
      <div className="w-100" style={{ maxWidth: '700px' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted fw-bold">Progress</small>
          <Badge bg="dark" className="fs-6">
            Card {currentIndex + 1} of {totalCards}
          </Badge>
        </div>
        <ProgressBar 
          now={progress} 
          variant="dark" 
          style={{ height: '10px', background: '#e0e0e0' }} 
        />
      </div>

      {/* Mode Tabs */}
      <ButtonGroup className="w-100" style={{ maxWidth: '700px' }}>
        <Button 
          variant={studyMode === 'flashcard' ? 'dark' : 'outline-dark'}
          onClick={() => handleModeChange('flashcard')}
          className="py-2 fw-bold"
        >
          📇 Flashcard
        </Button>
        <Button 
          variant={studyMode === 'multiple-choice' ? 'dark' : 'outline-dark'}
          onClick={() => handleModeChange('multiple-choice')}
          className="py-2 fw-bold"
        >
          🎯 Multiple Choice
        </Button>
        <Button 
          variant={studyMode === 'type-answer' ? 'dark' : 'outline-dark'}
          onClick={() => handleModeChange('type-answer')}
          className="py-2 fw-bold"
        >
          ⌨️ Type Answer
        </Button>
      </ButtonGroup>

      {/* Main Card */}
      <Card 
        className="shadow-lg" 
        style={{ 
          width: '100%', 
          maxWidth: '700px', 
          minHeight: '350px',
          border: '3px solid #000',
          borderRadius: '0.5rem'
        }}
      >
        <Card.Body className="d-flex flex-column justify-content-center p-4">
          {/* Question */}
          <div className="text-center mb-4">
            <small className="text-muted text-uppercase fw-bold d-block mb-3">
              Question
            </small>
            <h2 className="mb-0 fw-bold" style={{ color: '#000' }}>
              {card.front}
            </h2>
          </div>

          {/* Hint Display */}
          {hintShown && card.hint && (
            <Alert variant="warning" className="d-flex align-items-center gap-2 mt-3" style={{ border: '2px solid #000' }}>
              <Lightbulb size={20} />
              <span><strong>Hint:</strong> {card.hint}</span>
            </Alert>
          )}

          {/* FLASHCARD MODE */}
          {studyMode === 'flashcard' && (
            <div className="text-center mt-4">
              {isFlipped ? (
                <div>
                  <small className="text-muted text-uppercase fw-bold d-block mb-3">
                    Answer
                  </small>
                  <h3 className="fw-bold" style={{ color: '#000' }}>{card.back}</h3>
                </div>
              ) : (
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button 
                    variant="dark" 
                    size="lg"
                    onClick={handleFlip}
                    className="d-flex align-items-center gap-2 px-4"
                  >
                    <Eye size={20} />
                    Show Answer
                  </Button>
                  {card.hint && !hintUsed && (
                    <Button 
                      variant="outline-dark" 
                      size="lg"
                      onClick={handleShowHint}
                      className="d-flex align-items-center gap-2"
                    >
                      <Lightbulb size={20} />
                      Hint
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MULTIPLE CHOICE MODE */}
          {studyMode === 'multiple-choice' && (
            <div className="mt-4">
              {!feedback ? (
                <div className="d-flex flex-column gap-3">
                  {availableOptions.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline-dark"
                      size="lg"
                      onClick={() => handleMCSelection(option)}
                      className="text-start py-3 fw-bold"
                      style={{ 
                        fontSize: '1.1rem',
                        border: '2px solid #000'
                      }}
                    >
                      <strong>{String.fromCharCode(65 + mcOptions.indexOf(option))}.</strong> {option}
                    </Button>
                  ))}
                  {availableOptions.length > 2 && (
                    <Button 
                      variant="outline-dark" 
                      size="sm"
                      onClick={handleMCHint}
                      className="d-flex align-items-center gap-2 align-self-center mt-2"
                    >
                      <Lightbulb size={18} />
                      Remove Wrong Answer ({availableOptions.length - 1} remaining)
                    </Button>
                  )}
                </div>
              ) : (
                <Alert 
                  variant={feedback.correct ? 'success' : 'danger'} 
                  className="text-center py-4"
                  style={{ border: '3px solid #000', fontSize: '1.2rem', fontWeight: 'bold' }}
                >
                  <h4 className="mb-0">{feedback.message}</h4>
                  {feedback.correct && (
                    <div className="mt-3">
                      <Sparkles size={40} className="text-warning" />
                    </div>
                  )}
                </Alert>
              )}
            </div>
          )}

          {/* TYPE ANSWER MODE */}
          {studyMode === 'type-answer' && (
            <div className="mt-4">
              {!feedback ? (
                <Form onSubmit={handleSubmitTyped}>
                  {/* Blank template hint - always show */}
                  <div className="text-center mb-3 p-3" style={{ 
                    background: '#f8f9fa', 
                    border: '2px solid #000', 
                    borderRadius: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '1.5rem',
                    letterSpacing: '3px',
                    fontWeight: 'bold'
                  }}>
                    {blankTemplate || card.back.split('').map(c => c === ' ' ? ' ' : '_').join(' ')}
                  </div>
                  
                  <Form.Group>
                    <Form.Control
                      type="text"
                      placeholder="Type your answer..."
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      size="lg"
                      className="text-center mb-3 fw-bold"
                      autoFocus
                      style={{ 
                        fontSize: '1.2rem',
                        border: '2px solid #000'
                      }}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2 justify-content-center flex-wrap">
                    <Button 
                      variant="dark" 
                      size="lg" 
                      type="submit"
                      disabled={!typedAnswer.trim()}
                      className="px-5"
                    >
                      Submit Answer
                    </Button>
                    {revealedLetters.length < card.back.replace(/\s/g, '').length && (
                      <Button 
                        variant="outline-dark" 
                        size="lg"
                        onClick={handleTypeHint}
                        className="d-flex align-items-center gap-2"
                      >
                        <Lightbulb size={20} />
                        Reveal Letter
                      </Button>
                    )}
                  </div>
                </Form>
              ) : (
                <Alert 
                  variant={feedback.correct ? 'success' : 'danger'} 
                  className="text-center py-4"
                  style={{ border: '3px solid #000', fontSize: '1.2rem', fontWeight: 'bold' }}
                >
                  <h4 className="mb-0">{feedback.message}</h4>
                  {feedback.correct && (
                    <div className="mt-3">
                      <Sparkles size={40} className="text-warning" />
                    </div>
                  )}
                </Alert>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Rating Buttons (Flashcard mode only) */}
      {studyMode === 'flashcard' && isFlipped && (
        <div className="w-100" style={{ maxWidth: '700px' }}>
          <p className="text-center mb-3 fw-bold" style={{ fontSize: '1.1rem' }}>How well did you know this?</p>
          
          <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', display: 'grid' }}>
            <Button 
              variant="outline-danger" 
              onClick={() => handleRate(1)}
              className="py-3"
              style={{ border: '2px solid #dc3545', fontWeight: 'bold' }}
            >
              <div className="d-flex flex-column">
                <span className="fw-bold">Again</span>
                <small style={{ fontSize: '0.75rem' }}>1 min</small>
              </div>
            </Button>
            
            <Button 
              variant="outline-warning" 
              onClick={() => handleRate(2)}
              className="py-3"
              style={{ border: '2px solid #ffc107', fontWeight: 'bold' }}
            >
              <div className="d-flex flex-column">
                <span className="fw-bold">Hard</span>
                <small style={{ fontSize: '0.75rem' }}>10 min</small>
              </div>
            </Button>
            
            <Button 
              variant="outline-primary" 
              onClick={() => handleRate(3)}
              className="py-3"
              style={{ border: '2px solid #0d6efd', fontWeight: 'bold' }}
            >
              <div className="d-flex flex-column">
                <span className="fw-bold">Good</span>
                <small style={{ fontSize: '0.75rem' }}>1 day</small>
              </div>
            </Button>
            
            <Button 
              variant="outline-success" 
              onClick={() => handleRate(4)}
              className="py-3"
              style={{ border: '2px solid #198754', fontWeight: 'bold' }}
            >
              <div className="d-flex flex-column">
                <span className="fw-bold">Easy</span>
                <small style={{ fontSize: '0.75rem' }}>4 days</small>
              </div>
            </Button>
          </div>

          {hintUsed && (
            <Alert variant="warning" className="mt-3 text-center mb-0" style={{ border: '2px solid #000' }}>
              <small className="fw-bold">⚠️ Hint was used - Quality capped at "Hard"</small>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyCard;
