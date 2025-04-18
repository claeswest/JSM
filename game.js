// game.js
const pads = [...document.querySelectorAll('.pad')];
const startBtn = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level-display');
const comboDisplay = document.getElementById('combo-display');
const modal = document.getElementById('modal');

let audioCtx, unlocked = false;
let sequence = [], playerInput = [], level = 0, combo = 0;
const TONE_DURATION = 600; // ms
const PAUSE_DURATION = 300;

// Ensure AudioContext unlock on first touch
document.addEventListener('touchstart', () => {
  if (!unlocked) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    unlocked = true;
  }
}, { once: true });

// Check Web Audio support
if (!window.AudioContext && !window.webkitAudioContext) {
  modal.classList.remove('hidden');
}

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

function flashPad(pad) {
  pad.classList.add('active');
  setTimeout(() => pad.classList.remove('active'), TONE_DURATION);
  navigator.vibrate?.(50);
}

function playSequence() {
  let time = audioCtx.currentTime + 0.5;
  sequence.forEach((freq, i) => {
    playTone(freq, time + i * (TONE_DURATION + PAUSE_DURATION) / 1000);
    setTimeout(() => flashPad(pads.find(p => +p.dataset.tone === freq)), (time - audioCtx.currentTime)*1000 + i*(TONE_DURATION+PAUSE_DURATION));
  });
}

function nextRound() {
  level++;
  levelDisplay.textContent = `Level: ${level}`;
  combo = 0;
  comboDisplay.textContent = `Combo: ${combo}`;
  sequence.push(pads[Math.floor(Math.random()*pads.length)].dataset.tone);
  playerInput = [];
  playSequence();
}

pads.forEach(pad => {
  pad.addEventListener('click', () => {
    if (!unlocked) return;
    const freq = +pad.dataset.tone;
    playTone(freq, audioCtx.currentTime);
    flashPad(pad);
    if (sequence.length === 0) return;
    playerInput.push(freq);
    const idx = playerInput.length - 1;
    if (freq !== sequence[idx]) {
      // wrong - reset
      alert('Wrong tone! Try again.');
      playerInput = [];
      combo = 0;
      comboDisplay.textContent = `Combo: ${combo}`;
      playSequence();
      return;
    }
    if (playerInput.length === sequence.length) {
      combo++;
      comboDisplay.textContent = `Combo: ${combo}`;
      setTimeout(nextRound, 800);
    }
  });
});

startBtn.addEventListener('click', () => {
  if (!unlocked) return;
  sequence = [];
  level = 0;
  nextRound();
});
