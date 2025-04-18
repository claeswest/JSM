// game.js

// Element refs
const pads         = Array.from(document.querySelectorAll('.pad'));
const startBtn     = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level-display');
const comboDisplay = document.getElementById('combo-display');
const modal        = document.getElementById('modal');

// Audio setup
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let unlocked = false;

// Game state
let sequence    = [];
let playerInput = [];
let level       = 0;
let combo       = 0;

// Timing constants (ms)
const TONE_DURATION  = 600;
const PAUSE_DURATION = 300;

/**
 * Unlock or resume AudioContext on first gesture,
 * then play a 440 Hz test beep and log state.
 */
function unlockAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
    console.log('[JSM] Created AudioContext');
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log('[JSM] AudioContext resumed:', audioCtx.state);
      // test beep
      playTone(440, audioCtx.currentTime);
      console.log('[JSM] ▶️ Test beep at 440 Hz');
    }).catch(err => {
      console.warn('[JSM] resume() failed:', err);
    });
  } else {
    console.log('[JSM] AudioContext state:', audioCtx.state);
  }
  unlocked = true;
}

// Hook both touch and click to cover mobile & desktop
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click',      unlockAudio, { once: true });

// Fallback modal if no Web Audio support
if (!window.AudioContext && !window.webkitAudioContext) {
  modal.classList.remove('hidden');
}

/** Play a sine‑wave tone */
function playTone(freq, when) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + TONE_DURATION / 1000);
}

/** Flash pad visually & vibrate */
function flashPad(pad) {
  pad.classList.add('active');
  setTimeout(() => pad.classList.remove('active'), TONE_DURATION);
  navigator.vibrate?.(50);
}

/** Play back the current sequence */
function playSequence() {
  const startTime = audioCtx.currentTime + 0.5;
  sequence.forEach((freq, i) => {
    const t = startTime + i * (TONE_DURATION + PAUSE_DURATION) / 1000;
    playTone(freq, t);
    setTimeout(() => {
      const pad = pads.find(p => +p.dataset.tone === freq);
      if (pad) flashPad(pad);
    }, (t - audioCtx.currentTime) * 1000);
  });
}

/** Advance to next level */
function nextRound() {
  level++;
  levelDisplay.textContent = `Level: ${level}`;
  combo = 0;
  comboDisplay.textContent = `Combo: ${combo}`;

  const randomPad = pads[Math.floor(Math.random() * pads.length)];
  sequence.push(+randomPad.dataset.tone);
  playerInput = [];

  console.log('[JSM] New sequence:', sequence);
  playSequence();
}

// Handle pad taps
pads.forEach(pad => {
  pad.addEventListener('click', () => {
    console.log('[JSM] Pad tapped:', pad.dataset.tone, 'Unlocked:', unlocked);
    if (!unlocked) {
      console.warn('[JSM] Audio not unlocked yet');
      return;
    }
    const freq = +pad.dataset.tone;
    playTone(freq, audioCtx.currentTime);
    flashPad(pad);

    if (!sequence.length) return;
    playerInput.push(freq);

    // Wrong input
    if (freq !== sequence[playerInput.length - 1]) {
      alert('Wrong tone! Try again.');
      playerInput = [];
      combo = 0;
      comboDisplay.textContent = `Combo: ${combo}`;
      playSequence();
      return;
    }

    // Completed sequence
    if (playerInput.length === sequence.length) {
      combo++;
      comboDisplay.textContent = `Combo: ${combo}`;
      setTimeout(nextRound, 800);
    }
  });
});

// Start button
startBtn.addEventListener('click', () => {
  console.log('[JSM] Start pressed');
  unlockAudio();
  sequence = [];
  level = 0;
  nextRound();
});
