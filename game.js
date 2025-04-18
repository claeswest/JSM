// game.js

// ———————————————————————————————
// Element references
// ———————————————————————————————
const pads         = Array.from(document.querySelectorAll('.pad'));
const startBtn     = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level-display');
const comboDisplay = document.getElementById('combo-display');
const modal        = document.getElementById('modal');

// ———————————————————————————————
// AudioContext setup
// ———————————————————————————————
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let audioUnlocked = false;

// ———————————————————————————————
// Game state & timing
// ———————————————————————————————
let sequence    = [];
let playerInput = [];
let level       = 0;
let combo       = 0;

const TONE_DURATION  = 600; // ms
const PAUSE_DURATION = 300; // ms

// ———————————————————————————————
// Unlock/resume function returns a Promise
// ———————————————————————————————
function unlockAudio() {
  if (!AudioCtx) {
    // Web Audio not supported
    modal.classList.remove('hidden');
    return Promise.reject('Web Audio API unsupported');
  }
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    return audioCtx.resume().then(() => {
      audioUnlocked = true;
    });
  }
  // already running
  audioUnlocked = true;
  return Promise.resolve();
}

// ———————————————————————————————
// Listen for first user gesture on touch OR click
// ———————————————————————————————
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click',      unlockAudio, { once: true });

// ———————————————————————————————
// Play a sine‑wave tone at given time
// ———————————————————————————————
function playTone(freq, when) {
  if (!audioUnlocked) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + TONE_DURATION / 1000);
}

// ———————————————————————————————
// Flash pad & vibrate
// ———————————————————————————————
function flashPad(pad) {
  pad.classList.add('active');
  setTimeout(() => pad.classList.remove('active'), TONE_DURATION);
  navigator.vibrate?.(50);
}

// ———————————————————————————————
// Play through the current sequence
// ———————————————————————————————
function playSequence() {
  const startTime = audioCtx.currentTime + 0.5;
  sequence.forEach((freq, idx) => {
    const t = startTime + idx * (TONE_DURATION + PAUSE_DURATION) / 1000;
    playTone(freq, t);
    setTimeout(() => {
      const pad = pads.find(p => +p.dataset.tone === freq);
      if (pad) flashPad(pad);
    }, (t - audioCtx.currentTime) * 1000);
  });
}

// ———————————————————————————————
// Move to next round
// ———————————————————————————————
function nextRound() {
  level++;
  levelDisplay.textContent = `Level: ${level}`;
  combo = 0;
  comboDisplay.textContent = `Combo: ${combo}`;

  // pick a random pad frequency
  const randomPad = pads[Math.floor(Math.random() * pads.length)];
  sequence.push(+randomPad.dataset.tone);
  playerInput = [];

  playSequence();
}

// ———————————————————————————————
// Pad tap handler
// ———————————————————————————————
pads.forEach(pad => {
  pad.addEventListener('click', () => {
    if (!audioUnlocked) return;
    const freq = +pad.dataset.tone;
    playTone(freq, audioCtx.currentTime);
    flashPad(pad);

    if (sequence.length === 0) return;
    playerInput.push(freq);

    // wrong input
    if (freq !== sequence[playerInput.length - 1]) {
      alert('Wrong tone! Try again.');
      playerInput = [];
      combo = 0;
      comboDisplay.textContent = `Combo: ${combo}`;
      playSequence();
      return;
    }

    // completed correctly
    if (playerInput.length === sequence.length) {
      combo++;
      comboDisplay.textContent = `Combo: ${combo}`;
      setTimeout(nextRound, 800);
    }
  });
});

// ———————————————————————————————
// Start button handler
// ———————————————————————————————
startBtn.addEventListener('click', () => {
  unlockAudio()
    .then(() => {
      // only begin the game once audio is unlocked
      sequence = [];
      level = 0;
      nextRound();
    })
    .catch(err => console.warn('Audio unlock failed:', err));
});
