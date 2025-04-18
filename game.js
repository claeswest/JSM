// game.js

// Element references
const pads         = [...document.querySelectorAll('.pad')];
const startBtn     = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level-display');
const comboDisplay = document.getElementById('combo-display');
const modal        = document.getElementById('modal');

// Audio setup
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx, unlocked = false;

// Game state
let sequence     = [];
let playerInput  = [];
let level        = 0;
let combo        = 0;

// Timing constants (milliseconds)
const TONE_DURATION  = 600;
const PAUSE_DURATION = 300;

/**
 * Unlock or resume the AudioContext on first user gesture.
 */
function unlockAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  unlocked = true;
}

// Unlock on touch (iOS) or click (desktop)
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click',      unlockAudio, { once: true });

// If Web Audio API isn't supported, show fallback modal
if (!window.AudioContext && !window.webkitAudioContext) {
  modal.classList.remove('hidden');
}

/**
 * Play a sine‑wave tone of given frequency at specified AudioContext time.
 * @param {number} freq — frequency in Hz
 * @param {number} when — audioCtx.currentTime + offset in seconds
 */
function playTone(freq, when) {
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + TONE_DURATION / 1000);
}

/**
 * Flash the pad visually and trigger haptic feedback.
 * @param {HTMLElement} pad
 */
function flashPad(pad) {
  pad.classList.add('active');
  setTimeout(() => pad.classList.remove('active'), TONE_DURATION);
  navigator.vibrate?.(50);
}

/**
 * Play back the current sequence of tones with appropriate timing.
 */
function playSequence() {
  let time = audioCtx.currentTime + 0.5;
  sequence.forEach((freq, i) => {
    playTone(freq, time + i * (TONE_DURATION + PAUSE_DURATION) / 1000);
    setTimeout(() => {
      const pad = pads.find(p => +p.dataset.tone === freq);
      if (pad) flashPad(pad);
    }, (time - audioCtx.currentTime) * 1000 + i * (TONE_DURATION + PAUSE_DURATION));
  });
}

/**
 * Advance to the next round: bump level, pick a new random tone, reset input, and play.
 */
function nextRound() {
  level += 1;
  levelDisplay.textContent = `Level: ${level}`;
  combo = 0;
  comboDisplay.textContent = `Combo: ${combo}`;

  // Add a random pad tone (dataset.tone is a string, convert with +)
  const randomPad = pads[Math.floor(Math.random() * pads.length)];
  sequence.push(+randomPad.dataset.tone);

  playerInput = [];
  playSequence();
}

// Pad click handler: play tone, check against sequence, handle success/failure
pads.forEach(pad => {
  pad.addEventListener('click', () => {
    if (!unlocked) return;
    const freq = +pad.dataset.tone;
    playTone(freq, audioCtx.currentTime);
    flashPad(pad);

    // If sequence not started yet
    if (sequence.length === 0) return;

    playerInput.push(freq);
    const idx = playerInput.length - 1;

    // Wrong tone
    if (freq !== sequence[idx]) {
      alert('Wrong tone! Try again.');
      playerInput = [];
      combo = 0;
      comboDisplay.textContent = `Combo: ${combo}`;
      playSequence();
      return;
    }

    // Completed sequence correctly
    if (playerInput.length === sequence.length) {
      combo += 1;
      comboDisplay.textContent = `Combo: ${combo}`;
      setTimeout(nextRound, 800);
    }
  });
});

// Start button handler: ensure audio is unlocked, reset state, and begin
startBtn.addEventListener('click', () => {
  unlockAudio();
  sequence = [];
  level = 0;
  nextRound();
});
