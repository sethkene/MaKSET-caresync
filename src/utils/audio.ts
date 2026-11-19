let sharedCtx: AudioContext | null = null;

export function playAlertChime(muted: boolean): void {
  if (muted || typeof window === 'undefined') return;
  let count = 0;

  const triggerTone = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedCtx) {
        sharedCtx = new AudioCtx();
      }
      if (sharedCtx.state === 'suspended') {
        void sharedCtx.resume();
      }
      const osc = sharedCtx.createOscillator();
      const gain = sharedCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = count === 0 ? 880 : 1046.5;
      osc.connect(gain);
      gain.connect(sharedCtx.destination);
      gain.gain.setValueAtTime(0.16, sharedCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sharedCtx.currentTime + 0.25);
      osc.start();
      osc.stop(sharedCtx.currentTime + 0.25);
    } catch {
      // Audio playback may be blocked until user interaction
    }
    count += 1;
    if (count < 2) {
      window.setTimeout(triggerTone, 280);
    }
  };

  triggerTone();
}
