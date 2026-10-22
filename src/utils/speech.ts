/**
 * Cheerful Spoken Cheerleader Voice (Web Speech API)
 * Encourages kids with playful praise, countdowns, and celebration cues!
 */

class CheerVoiceEngine {
  private enabled: boolean = true;
  private lastSpokenTime: number = 0;
  private cooldownMs: number = 2800; // avoid overlapping speech

  constructor() {
    const saved = localStorage.getItem('dino_jump_voice_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggleVoice(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('dino_jump_voice_enabled', String(this.enabled));
    if (!this.enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.enabled;
  }

  public cheer(phrase: string, priority: boolean = false) {
    if (!this.enabled || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (!priority && now - this.lastSpokenTime < this.cooldownMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.pitch = 1.35; // friendly, upbeat kid-cheer pitch
      utterance.rate = 1.05;

      // Find an English or cheerful friendly voice if available
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(
        (v) => (v.lang.startsWith('en') && v.name.includes('Natural')) || v.name.includes('Samantha') || v.name.includes('Google')
      );
      if (friendlyVoice) {
        utterance.voice = friendlyVoice;
      }

      window.speechSynthesis.speak(utterance);
      this.lastSpokenTime = now;
    } catch {
      // Safe fallback
    }
  }

  // Pre-configured fun cheer lines
  public cheerJump(jumpsCount: number) {
    if (jumpsCount === 5) this.cheer('Awesome! Five jumps in a row!');
    else if (jumpsCount === 10) this.cheer('Double digits! Look at you fly!');
    else if (jumpsCount === 20) this.cheer('Twenty jumps! You are a super dino!');
    else if (jumpsCount === 30) this.cheer('Thirty jumps! Unbelievable energy!');
    else if (Math.random() < 0.2) {
      const phrases = [
        'Great jump!',
        'Whoa, huge leap!',
        'Super high!',
        'Nice hops!',
        'You got it!',
        'To the sky!',
      ];
      this.cheer(phrases[Math.floor(Math.random() * phrases.length)]);
    }
  }

  public cheerHatch(babyName: string) {
    this.cheer(`Hooray! A cute baby ${babyName} just hatched!`, true);
  }

  public cheerFreeze() {
    this.cheer('Freeze! Freeze like a dinosaur statue!', true);
  }

  public cheerFreezePassed() {
    this.cheer('You did it! Perfect statue! Keep running!', true);
  }

  public cheerHeartLost() {
    this.cheer('Shake it off! You can do it!', true);
  }

  public cheerHeartFound() {
    this.cheer('Golden heart collected! Full energy!', true);
  }
}

export const cheerVoice = new CheerVoiceEngine();
