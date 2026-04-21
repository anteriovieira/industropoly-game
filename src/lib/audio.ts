// Procedural sound effects generated with the Web Audio API.
// No binary assets are shipped — every effect is synthesised from oscillators and noise.
// The audio context is created lazily and unlocked on the first user gesture.

type SoundName =
  | 'click'
  | 'dice'
  | 'hop'
  | 'buy'
  | 'card'
  | 'levy'
  | 'passStart'
  | 'prison'
  | 'escape'
  | 'bankrupt'
  | 'win';

const DEFAULT_VOLUME = 0.35;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private unlocked = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : DEFAULT_VOLUME;
  }

  // Must be called inside a user gesture handler to satisfy autoplay policy.
  unlock(): void {
    if (this.unlocked) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    this.unlocked = true;
  }

  play(name: SoundName): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    switch (name) {
      case 'click':
        this.click(ctx, this.master, t);
        break;
      case 'dice':
        this.dice(ctx, this.master, t);
        break;
      case 'hop':
        this.hop(ctx, this.master, t);
        break;
      case 'buy':
        this.buy(ctx, this.master, t);
        break;
      case 'card':
        this.card(ctx, this.master, t);
        break;
      case 'levy':
        this.levy(ctx, this.master, t);
        break;
      case 'passStart':
        this.passStart(ctx, this.master, t);
        break;
      case 'prison':
        this.prison(ctx, this.master, t);
        break;
      case 'escape':
        this.escape(ctx, this.master, t);
        break;
      case 'bankrupt':
        this.bankrupt(ctx, this.master, t);
        break;
      case 'win':
        this.win(ctx, this.master, t);
        break;
    }
  }

  // -- internals -----------------------------------------------------------

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctx: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctx) return null;
    try {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : DEFAULT_VOLUME;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    ctx: AudioContext,
    out: AudioNode,
    opts: {
      type?: OscillatorType;
      freq: number;
      endFreq?: number;
      duration: number;
      gain?: number;
      attack?: number;
      decay?: number;
      at: number;
    },
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, opts.at);
    if (opts.endFreq && opts.endFreq !== opts.freq) {
      osc.frequency.exponentialRampToValueAtTime(opts.endFreq, opts.at + opts.duration);
    }
    const peak = opts.gain ?? 0.5;
    const attack = opts.attack ?? 0.005;
    const decay = opts.decay ?? opts.duration;
    g.gain.setValueAtTime(0, opts.at);
    g.gain.linearRampToValueAtTime(peak, opts.at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, opts.at + attack + decay);
    osc.connect(g).connect(out);
    osc.start(opts.at);
    osc.stop(opts.at + attack + decay + 0.02);
  }

  private noiseBurst(
    ctx: AudioContext,
    out: AudioNode,
    opts: {
      duration: number;
      gain?: number;
      filterFreq?: number;
      filterQ?: number;
      at: number;
    },
  ): void {
    const len = Math.floor(ctx.sampleRate * opts.duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = opts.filterFreq ?? 1200;
    filter.Q.value = opts.filterQ ?? 0.7;
    const g = ctx.createGain();
    const peak = opts.gain ?? 0.3;
    g.gain.setValueAtTime(peak, opts.at);
    g.gain.exponentialRampToValueAtTime(0.001, opts.at + opts.duration);
    src.connect(filter).connect(g).connect(out);
    src.start(opts.at);
    src.stop(opts.at + opts.duration + 0.02);
  }

  private click(ctx: AudioContext, out: AudioNode, at: number): void {
    this.tone(ctx, out, { type: 'triangle', freq: 880, duration: 0.05, gain: 0.18, at });
  }

  private dice(ctx: AudioContext, out: AudioNode, at: number): void {
    // Three overlapping noise bursts — wooden clatter.
    for (let i = 0; i < 3; i++) {
      this.noiseBurst(ctx, out, {
        at: at + i * 0.06,
        duration: 0.12,
        gain: 0.35,
        filterFreq: 900 + i * 350,
        filterQ: 1.5,
      });
    }
    // A final "settle" tick.
    this.tone(ctx, out, {
      type: 'triangle',
      freq: 260,
      duration: 0.08,
      gain: 0.25,
      at: at + 0.22,
    });
  }

  private hop(ctx: AudioContext, out: AudioNode, at: number): void {
    this.tone(ctx, out, {
      type: 'triangle',
      freq: 520,
      endFreq: 780,
      duration: 0.09,
      gain: 0.22,
      at,
    });
  }

  private buy(ctx: AudioContext, out: AudioNode, at: number): void {
    // Bright two-note arpeggio (coin ring).
    this.tone(ctx, out, { type: 'sine', freq: 988, duration: 0.14, gain: 0.4, at });
    this.tone(ctx, out, {
      type: 'sine',
      freq: 1319,
      duration: 0.18,
      gain: 0.35,
      at: at + 0.06,
    });
    this.tone(ctx, out, { type: 'triangle', freq: 2637, duration: 0.1, gain: 0.15, at: at + 0.1 });
  }

  private card(ctx: AudioContext, out: AudioNode, at: number): void {
    // Paper rustle.
    this.noiseBurst(ctx, out, {
      at,
      duration: 0.22,
      gain: 0.28,
      filterFreq: 3200,
      filterQ: 0.7,
    });
    this.tone(ctx, out, { type: 'sine', freq: 660, duration: 0.08, gain: 0.18, at: at + 0.18 });
  }

  private levy(ctx: AudioContext, out: AudioNode, at: number): void {
    // Descending minor third — a tax, a loss.
    this.tone(ctx, out, {
      type: 'sawtooth',
      freq: 330,
      endFreq: 220,
      duration: 0.35,
      gain: 0.3,
      at,
    });
  }

  private passStart(ctx: AudioContext, out: AudioNode, at: number): void {
    // Bell-ish ascending triad.
    [523.25, 659.25, 783.99].forEach((f, i) => {
      this.tone(ctx, out, {
        type: 'sine',
        freq: f,
        duration: 0.35,
        gain: 0.32,
        at: at + i * 0.08,
      });
    });
  }

  private prison(ctx: AudioContext, out: AudioNode, at: number): void {
    // Low metallic clang — two tones with dissonant overlap.
    this.tone(ctx, out, {
      type: 'square',
      freq: 180,
      duration: 0.45,
      gain: 0.3,
      at,
    });
    this.tone(ctx, out, {
      type: 'triangle',
      freq: 240,
      duration: 0.45,
      gain: 0.2,
      at: at + 0.02,
    });
  }

  private escape(ctx: AudioContext, out: AudioNode, at: number): void {
    // Rising swoop — a breath of freedom.
    this.tone(ctx, out, {
      type: 'triangle',
      freq: 330,
      endFreq: 880,
      duration: 0.3,
      gain: 0.3,
      at,
    });
  }

  private bankrupt(ctx: AudioContext, out: AudioNode, at: number): void {
    this.tone(ctx, out, {
      type: 'sawtooth',
      freq: 200,
      endFreq: 80,
      duration: 0.9,
      gain: 0.35,
      at,
    });
  }

  private win(ctx: AudioContext, out: AudioNode, at: number): void {
    // Triumphant C major arpeggio.
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(ctx, out, {
        type: 'triangle',
        freq: f,
        duration: 0.5,
        gain: 0.34,
        at: at + i * 0.12,
      });
    });
  }
}

export const audio = new AudioEngine();

// Unlock on first interaction. Idempotent, safe outside a browser.
if (typeof window !== 'undefined') {
  const unlock = (): void => {
    audio.unlock();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
}
