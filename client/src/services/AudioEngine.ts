class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private stepIndex: number = 0;
  private climaxMode: boolean = false;
  private stormGain: GainNode | null = null;
  private stormSource: AudioBufferSourceNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(mute ? 0 : 0.22, now, 0.12);
    }
    if (this.stormGain) {
      this.stormGain.gain.setTargetAtTime(mute ? 0 : 0.08, now, 0.2);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setClimaxMode(active: boolean): void {
    this.climaxMode = active;
  }

  public startAmbientDrone(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.musicTimer !== null) return;

    const masterMusic = ctx.createGain();
    masterMusic.gain.value = this.muted ? 0 : 0.22;
    masterMusic.connect(ctx.destination);
    this.musicGain = masterMusic;

    // A minor sci-fi synthwave progression (Hz): A1, F1, G1, E1
    const bassRoots = [55.0, 43.65, 49.0, 41.2];
    const arpPatterns = [
      [220.0, 261.63, 329.63, 440.0], // Am
      [174.61, 220.0, 261.63, 349.23], // F
      [196.0, 246.94, 293.66, 392.0], // G
      [164.81, 196.0, 246.94, 329.63], // Em
    ];

    const playStep = () => {
      if (!this.ctx || !this.musicGain || this.muted) {
        this.stepIndex = (this.stepIndex + 1) % 32;
        return;
      }
      const now = this.ctx.currentTime;
      const bar = Math.floor(this.stepIndex / 8) % 4;
      const beatInBar = this.stepIndex % 8;

      // Pulsing synth bass on even 8th notes (or every 8th note in climax)
      if (beatInBar % 2 === 0 || this.climaxMode) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassRoots[bar], now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(this.climaxMode ? 520 : 280, now);
        bassFilter.frequency.exponentialRampToValueAtTime(110, now + 0.18);

        bassGain.gain.setValueAtTime(0.001, now);
        bassGain.gain.linearRampToValueAtTime(this.climaxMode ? 0.22 : 0.15, now + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.22);
      }

      // Warm pad on beat 0 of each bar
      if (beatInBar === 0) {
        const chord = arpPatterns[bar];
        chord.slice(0, 3).forEach((freq) => {
          if (!this.ctx || !this.musicGain) return;
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();
          padOsc.type = 'triangle';
          padOsc.frequency.setValueAtTime(freq * 0.5, now);

          padGain.gain.setValueAtTime(0.001, now);
          padGain.gain.linearRampToValueAtTime(0.055, now + 0.25);
          padGain.gain.exponentialRampToValueAtTime(0.001, now + 1.65);

          padOsc.connect(padGain);
          padGain.connect(this.musicGain);
          padOsc.start(now);
          padOsc.stop(now + 1.7);
        });
      }

      // Crystalline arpeggio shimmer
      const arpNote = arpPatterns[bar][beatInBar % 4];
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = this.climaxMode ? 'square' : 'sine';
      arpOsc.frequency.setValueAtTime(
        this.climaxMode ? arpNote * 2 : arpNote,
        now
      );

      arpGain.gain.setValueAtTime(0.001, now);
      arpGain.gain.linearRampToValueAtTime(this.climaxMode ? 0.065 : 0.05, now + 0.015);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);
      arpOsc.start(now);
      arpOsc.stop(now + 0.2);

      this.stepIndex = (this.stepIndex + 1) % 32;
    };

    playStep();
    this.musicTimer = window.setInterval(playStep, 220);
  }

  public startStormRush(): void {
    this.climaxMode = true;
    const ctx = this.ensureContext();
    if (!ctx || this.stormSource) return;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 460;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this.stormSource = noise;
    this.stormGain = gain;
  }

  public stopStormRush(): void {
    this.climaxMode = false;
    if (this.stormSource) {
      try {
        this.stormSource.stop();
        this.stormSource.disconnect();
      } catch {
        // ignore
      }
      this.stormSource = null;
      this.stormGain = null;
    }
  }

  public playHologramChime(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.07 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.48);
    });
  }

  public playInteract(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.09);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playWarningKlaxon(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const start = now + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(310, start);
      osc.frequency.linearRampToValueAtTime(220, start + 0.16);

      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.19);
    }
  }

  public playShieldBlock(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playVictoryFanfare(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.09 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.95);
    });
  }
}

export const audioEngine = new AudioEngine();
