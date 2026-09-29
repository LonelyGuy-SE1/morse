import type { AudioSettings } from '../types/morse';
import { MORSE_TABLE } from '../utils/morseData';

export class CwAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Active oscillator for manual keying
  private manualOsc: OscillatorNode | null = null;
  private manualGain: GainNode | null = null;
  private manualStartTime: number = 0;

  // HF Noise nodes
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  // Sequence playback state
  private activeTimeouts: number[] = [];
  private isPlayingSequence: boolean = false;

  private settings: AudioSettings = {
    pitch: 650,
    charWpm: 20,
    effectiveWpm: 8,
    volume: 0.8,
    hfNoiseEnabled: false,
    hfNoiseVolume: 0.15,
    attackDecayMs: 5,
    theme: 'neo-brutal',
  };

  constructor(initialSettings?: Partial<AudioSettings>) {
    if (initialSettings) {
      this.settings = { ...this.settings, ...initialSettings };
    }
  }

  // Initialize or resume AudioContext
  public async initAudio(): Promise<void> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.volume, this.ctx.currentTime);

      // Analyser for CRT Oscilloscope
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      if (this.settings.hfNoiseEnabled) {
        this.startHfNoise();
      }
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.settings.volume, this.ctx.currentTime, 0.02);
    }

    if (this.settings.hfNoiseEnabled) {
      if (!this.noiseSource) {
        this.startHfNoise();
      } else if (this.noiseGain && this.ctx) {
        this.noiseGain.gain.setTargetAtTime(this.settings.hfNoiseVolume, this.ctx.currentTime, 0.05);
      }
    } else {
      this.stopHfNoise();
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  // Standard ARRL / ITU Farnsworth Timing Calculations
  public calculateTiming(charWpm = this.settings.charWpm, effectiveWpm = this.settings.effectiveWpm) {
    // Standard PARIS formula: 50 units per word
    const ditSec = 1.2 / charWpm;
    const dahSec = 3 * ditSec;
    const intraCharSec = ditSec; // space between dits/dahs within a character

    let charSpaceSec: number;
    let wordSpaceSec: number;

    if (effectiveWpm >= charWpm) {
      // Standard spacing
      charSpaceSec = 3 * ditSec;
      wordSpaceSec = 7 * ditSec;
    } else {
      // Farnsworth stretched spacing
      // Delta represents added delay per standard 50-unit PARIS word
      const delta = (60 / effectiveWpm) - (60 / charWpm);
      // In PARIS, there are 4 character spaces (3 units each) and 1 word space (7 units) => total 19 space units
      charSpaceSec = (3 * ditSec) + (delta * (3 / 19));
      wordSpaceSec = (7 * ditSec) + (delta * (7 / 19));
    }

    return {
      ditMs: ditSec * 1000,
      dahMs: dahSec * 1000,
      intraCharMs: intraCharSec * 1000,
      charSpaceMs: charSpaceSec * 1000,
      wordSpaceMs: wordSpaceSec * 1000,
    };
  }

  // Play a single tone pulse with smooth attack & decay
  public playTone(durationSec: number, startTime?: number): void {
    if (!this.ctx || !this.masterGain) return;

    const now = startTime ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.settings.pitch, now);

    const rampSec = this.settings.attackDecayMs / 1000;

    // Raised cosine / smooth exponential ramp up
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + rampSec);
    // Smooth ramp down
    gain.gain.setValueAtTime(1, Math.max(now + rampSec, now + durationSec - rampSec));
    gain.gain.linearRampToValueAtTime(0, now + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.01);
  }

  // Play text or Morse sequence with real-time character callback
  public async playSequence(
    text: string,
    onCharProgress?: (charIndex: number, char: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    await this.initAudio();
    this.stopSequence(); // Cancel any existing playback

    if (!this.ctx) return;
    this.isPlayingSequence = true;

    const { ditMs, dahMs, intraCharMs, charSpaceMs, wordSpaceMs } = this.calculateTiming();
    const upperText = text.toUpperCase();

    let accumulatedDelayMs = 50; // brief initial delay

    for (let i = 0; i < upperText.length; i++) {
      if (!this.isPlayingSequence) break;

      const char = upperText[i];

      if (char === ' ') {
        accumulatedDelayMs += wordSpaceMs;
        continue;
      }

      // Check if it is a prosign like <AR> or single char
      let morse = MORSE_TABLE[char];
      let charLength = 1;

      if (char === '<') {
        const closeIdx = upperText.indexOf('>', i);
        if (closeIdx !== -1) {
          const prosign = upperText.substring(i, closeIdx + 1);
          if (MORSE_TABLE[prosign]) {
            morse = MORSE_TABLE[prosign];
            charLength = prosign.length;
          }
        }
      }

      if (!morse) {
        accumulatedDelayMs += charSpaceMs;
        continue;
      }

      const currentCharIdx = i;
      const currentChar = charLength > 1 ? upperText.substring(i, i + charLength) : char;

      // Schedule UI progress callback
      const timerId = window.setTimeout(() => {
        if (this.isPlayingSequence && onCharProgress) {
          onCharProgress(currentCharIdx, currentChar);
        }
      }, accumulatedDelayMs);
      this.activeTimeouts.push(timerId);

      // Schedule audio tones for each dit and dah
      for (let e = 0; e < morse.length; e++) {
        const symbol = morse[e];
        const isDah = symbol === '-';
        const toneDurationSec = (isDah ? dahMs : ditMs) / 1000;
        const toneStartSec = this.ctx.currentTime + (accumulatedDelayMs / 1000);

        this.playTone(toneDurationSec, toneStartSec);

        accumulatedDelayMs += isDah ? dahMs : ditMs;
        if (e < morse.length - 1) {
          accumulatedDelayMs += intraCharMs;
        }
      }

      // Inter-character space
      accumulatedDelayMs += charSpaceMs;
      if (charLength > 1) {
        i += charLength - 1;
      }
    }

    // Schedule completion callback
    const completionTimer = window.setTimeout(() => {
      this.isPlayingSequence = false;
      if (onComplete) onComplete();
    }, accumulatedDelayMs + 100);
    this.activeTimeouts.push(completionTimer);
  }

  // Cancel any running sequence
  public stopSequence(): void {
    this.isPlayingSequence = false;
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlayingSequence;
  }

  // Manual Straight Key / Continuous Tone for Sending
  public startManualTone(): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.manualOsc) return; // already sounding

    const now = this.ctx.currentTime;
    this.manualStartTime = performance.now();

    this.manualOsc = this.ctx.createOscillator();
    this.manualGain = this.ctx.createGain();

    this.manualOsc.type = 'sine';
    this.manualOsc.frequency.setValueAtTime(this.settings.pitch, now);

    const rampSec = this.settings.attackDecayMs / 1000;
    this.manualGain.gain.setValueAtTime(0, now);
    this.manualGain.gain.linearRampToValueAtTime(1, now + rampSec);

    this.manualOsc.connect(this.manualGain);
    this.manualGain.connect(this.masterGain);

    this.manualOsc.start(now);
  }

  public stopManualTone(): number {
    if (!this.ctx || !this.manualOsc || !this.manualGain) return 0;

    const durationMs = performance.now() - this.manualStartTime;
    const now = this.ctx.currentTime;
    const rampSec = this.settings.attackDecayMs / 1000;

    this.manualGain.gain.setValueAtTime(this.manualGain.gain.value, now);
    this.manualGain.gain.linearRampToValueAtTime(0, now + rampSec);

    const osc = this.manualOsc;
    window.setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    }, (rampSec + 0.01) * 1000);

    this.manualOsc = null;
    this.manualGain = null;

    return durationMs;
  }

  // Atmospheric HF Radio Static / Noise Generator
  private startHfNoise(): void {
    if (!this.ctx || !this.masterGain) return;
    this.stopHfNoise();

    // Create 4 seconds of filtered pink/white noise buffer
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0555179;
      b1 = 0.96300 * b1 + white * 0.0750759;
      b2 = 0.57000 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.1) * 0.2;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    // Bandpass filter to match CW communications receiver bandwidth (300 - 2800 Hz)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(this.settings.pitch, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(this.settings.hfNoiseVolume, this.ctx.currentTime);

    this.noiseSource.connect(bandpass);
    bandpass.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    this.noiseSource.start();
  }

  private stopHfNoise(): void {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // already stopped
      }
      this.noiseSource = null;
    }
  }

  // Quick single dit/dah audio feedback test
  public testTone(type: 'dit' | 'dah'): void {
    this.initAudio().then(() => {
      const { ditMs, dahMs } = this.calculateTiming();
      const durationSec = (type === 'dit' ? ditMs : dahMs) / 1000;
      this.playTone(durationSec);
    });
  }
}

// Singleton instance for global access
export const audioEngine = new CwAudioEngine();
