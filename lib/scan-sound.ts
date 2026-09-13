let context: AudioContext | undefined;

// Call from the button gesture, before opening the camera or awaiting ZXing.
export function prepareScanSound() {
  try {
    if (!context || context.state === "closed") context = new AudioContext();
    if (context.state !== "running") void context.resume().catch(() => {});
  } catch {
    // Audio support is optional: scanning must work without it.
  }
}

export function playScanSound() {
  if (!context || context.state !== "running") return;
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1046, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.setValueAtTime(0.12, now + 0.07);
    gain.gain.linearRampToValueAtTime(0, now + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + 0.13);
  } catch {
    // A blocked or interrupted audio output must not interrupt onCode.
  }
}
