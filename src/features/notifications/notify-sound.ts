/** Shared notification / chat alert sound (`public/sounds/notify.mp3`). */

const SOUND_SRC = "/sounds/notify.mp3";
const DEBOUNCE_MS = 750;

let audio: HTMLAudioElement | null = null;
let lastPlayAt = 0;
let unlocked = false;
let unlockBound = false;

function getAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(SOUND_SRC);
    audio.preload = "auto";
    audio.volume = 0.65;
  }
  return audio;
}

/** Call once after a user gesture so browsers allow later plays. */
export function unlockNotifySound() {
  if (typeof window === "undefined" || unlocked) return;
  const el = getAudio();
  if (!el) return;
  const prev = el.volume;
  el.volume = 0.001;
  void el
    .play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      el.volume = prev;
      unlocked = true;
    })
    .catch(() => {
      el.volume = prev;
    });
}

/** Bind one-time unlock on first pointer/keydown (safe to call multiple times). */
export function bindNotifySoundUnlock() {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;
  const onGesture = () => {
    unlockNotifySound();
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };
  window.addEventListener("pointerdown", onGesture, { once: true });
  window.addEventListener("keydown", onGesture, { once: true });
}

/** Play notify sound (debounced to avoid double fire from socket + notification). */
export function playNotifySound() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPlayAt < DEBOUNCE_MS) return;
  lastPlayAt = now;

  const el = getAudio();
  if (!el) return;

  try {
    el.currentTime = 0;
    void el.play().catch(() => {
      // Still locked — wait for next gesture unlock.
    });
  } catch {
    // ignore
  }
}
