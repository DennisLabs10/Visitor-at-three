let ctx = null;
let ambientNodes = null;
let heartbeatTimer = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function initAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

function thump(time, freq, dur, gainVal) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.4), time + dur);
  gain.gain.setValueAtTime(gainVal, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function noiseBurst(time, dur, gainVal, filterFreq, filterType = 'lowpass') {
  const c = getCtx();
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(gainVal, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(time);
}

export function playKnock() {
  const c = getCtx();
  const now = c.currentTime;
  [0, 0.35, 0.7].forEach((offset) => {
    noiseBurst(now + offset, 0.06, 0.9, 400);
    thump(now + offset, 90, 0.15, 0.5);
  });
}

export function playDoorCreak() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(260, now + 0.5);
  gain.gain.setValueAtTime(0.03, now);
  gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.65);
}

export function startHeartbeat() {
  stopHeartbeat();
  const beat = () => {
    const c = getCtx();
    const now = c.currentTime;
    thump(now, 60, 0.18, 0.6);
    thump(now + 0.18, 55, 0.18, 0.45);
  };
  beat();
  heartbeatTimer = setInterval(beat, 1000);
}

export function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

export function playScream() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.9);
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 1.0);
  noiseBurst(now, 0.9, 0.6, 2000);
}

export function playJumpscareSound() {
  const c = getCtx();
  const now = c.currentTime;
  noiseBurst(now, 0.55, 0.7, 4200, 'highpass');
  [740, 988, 1245].forEach((f) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 0.25, now + 0.55);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  });
  thump(now, 42, 0.55, 0.6);
}

export function playStab() {
  const c = getCtx();
  const now = c.currentTime;
  noiseBurst(now, 0.14, 0.55, 900);
  thump(now, 140, 0.3, 0.55);
}

export function startAmbient() {
  stopAmbient();
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 48;
  gain.gain.value = 0.05;
  osc.connect(gain).connect(c.destination);
  osc.start();
  ambientNodes = { osc, gain };
}

export function stopAmbient() {
  if (ambientNodes) {
    try { ambientNodes.osc.stop(); } catch (e) {}
    ambientNodes = null;
  }
}

export function setAmbientIntensity(v) {
  if (ambientNodes) ambientNodes.gain.gain.value = 0.02 + v * 0.06;
}
