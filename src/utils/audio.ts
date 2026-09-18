// Acoustic synthesis for realistic liquid droplet & glass resonance
let audioCtx: AudioContext | null = null;

export function playGlassResonance(pitch = 520, isMuted = false) {
  if (isMuted) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx?.resume();
    }
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // High purity sine tone with glass harmonic ring
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.8, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.95, now + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(pitch * 1.2, now);
    filter.Q.setValueAtTime(12, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.045, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  } catch {
    // Graceful silence if audio isn't supported or allowed yet
  }
}
