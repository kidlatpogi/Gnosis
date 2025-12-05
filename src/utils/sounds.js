/**
 * Sound Effects Utility
 * Creates and plays success sound for correct answers
 * Uses Web Audio API for crisp, lightweight sound generation
 */

// Cache for audio contexts and oscillators
let audioContext = null;

/**
 * Initialize or get the audio context
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play an exciting brain activation sound - like Gizmo's notification
 * Creates a sparkly, energetic rising tone with harmonics
 */
export function playBrainSound() {
  try {
    const context = getAudioContext();
    
    // Resume audio context if suspended (required by browsers)
    if (context.state === 'suspended') {
      context.resume().catch(err => console.log('Audio context resume failed:', err));
    }

    const now = context.currentTime;
    
    // Create multiple oscillators for rich, sparkly tone
    const frequencies = [800, 1200, 1600]; // Harmonics for richness
    const oscillators = [];
    const gains = [];
    
    frequencies.forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.connect(gain);
      gain.connect(context.destination);
      oscillators.push(osc);
      gains.push(gain);
      
      // Set waveform
      osc.type = index === 0 ? 'sine' : 'triangle'; // Mix sine and triangle for complexity
      
      // Rising frequency sweep (brain activation effect)
      osc.frequency.setValueAtTime(freq - 200, now);
      osc.frequency.exponentialRampToValueAtTime(freq + 400, now + 0.15);
      
      // Volume envelope - quick attack with decay
      const volumeScale = 1 / (index + 1); // Lower harmonics louder
      gain.gain.setValueAtTime(0.2 * volumeScale, now);
      gain.gain.exponentialRampToValueAtTime(0.05 * volumeScale, now + 0.15);
      
      // Start and stop
      osc.start(now);
      osc.stop(now + 0.15);
    });
    
    // Add a secondary "ping" that happens after the main sound
    setTimeout(() => {
      try {
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        
        osc2.connect(gain2);
        gain2.connect(context.destination);
        
        osc2.type = 'sine';
        const pingStart = context.currentTime;
        
        // High pitched "ding" 
        osc2.frequency.setValueAtTime(1800, pingStart);
        osc2.frequency.exponentialRampToValueAtTime(2400, pingStart + 0.08);
        
        gain2.gain.setValueAtTime(0.15, pingStart);
        gain2.gain.exponentialRampToValueAtTime(0.01, pingStart + 0.08);
        
        osc2.start(pingStart);
        osc2.stop(pingStart + 0.08);
      } catch {
        // Silently fail
      }
    }, 100);
  } catch (error) {
    console.log('Sound playback error (non-critical):', error);
    // Silently fail - don't interrupt user experience if sound fails
  }
}

/**
 * Play an error/incorrect sound
 * Creates a lower, descending tone
 */
export function playErrorSound() {
  try {
    const context = getAudioContext();
    
    if (context.state === 'suspended') {
      context.resume().catch(err => console.log('Audio context resume failed:', err));
    }

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.connect(gain);
    gain.connect(context.destination);

    // Descending tone for error
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (error) {
    console.log('Sound playback error (non-critical):', error);
  }
}

/**
 * Optional: Add sounds settings to localStorage for muting
 */
export function areSoundsEnabled() {
  const stored = localStorage.getItem('gnosis_sounds_enabled');
  // Default to true if not set
  return stored !== 'false';
}

export function setSoundsEnabled(enabled) {
  localStorage.setItem('gnosis_sounds_enabled', enabled ? 'true' : 'false');
}

/**
 * Wrapper to play brain sound only if enabled
 */
export function playSuccessSoundIfEnabled() {
  if (areSoundsEnabled()) {
    playBrainSound();
  }
}

export function playErrorSoundIfEnabled() {
  if (areSoundsEnabled()) {
    playErrorSound();
  }
}
