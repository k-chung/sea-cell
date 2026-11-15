// Sound effects, made with the browser's Web Audio synth (no audio files to license or load).
// Off by default; the player turns them on in the status bar. Browsers only allow sound after a click,
// which is always true here because sounds play in response to button presses.

export type SoundName = 'click' | 'launch' | 'alarm' | 'success' | 'fail';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null; // no audio available: stay silent
  }
}

/** One beep: frequency in Hz, start offset and length in seconds. */
function tone(
  a: AudioContext,
  freq: number,
  start: number,
  length: number,
  type: OscillatorType = 'square',
  volume = 0.05,
): void {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, a.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + length);
  osc.connect(gain).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + length);
}

/** A burst of noise (rocket rumble). */
function rumble(a: AudioContext, length: number): void {
  const buffer = a.createBuffer(1, a.sampleRate * length, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  const filter = a.createBiquadFilter();
  const gain = a.createGain();
  src.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = 300;
  gain.gain.value = 0.25;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start();
}

export function play(name: SoundName): void {
  const a = audio();
  if (!a) return;
  switch (name) {
    case 'click':
      tone(a, 880, 0, 0.04);
      return;
    case 'launch':
      rumble(a, 1.4);
      return;
    case 'alarm':
      [0, 0.3, 0.6].forEach((t) => {
        tone(a, 660, t, 0.14);
        tone(a, 440, t + 0.15, 0.14);
      });
      return;
    case 'success':
      [523, 659, 784].forEach((f, i) => {
        tone(a, f, i * 0.12, 0.18, 'triangle', 0.07);
      });
      return;
    case 'fail':
      [330, 247].forEach((f, i) => {
        tone(a, f, i * 0.2, 0.3, 'sawtooth', 0.04);
      });
      return;
  }
}
