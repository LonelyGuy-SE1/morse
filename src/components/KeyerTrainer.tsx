import { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import { REVERSE_MORSE_TABLE } from '../utils/morseData';
import type { AudioSettings, KeyerType } from '../types/morse';
import { 
  Trash2, 
  Activity
} from 'lucide-react';

interface KeyerTrainerProps {
  settings: AudioSettings;
  onKeyingStateChange: (active: boolean) => void;
}

export const KeyerTrainer: React.FC<KeyerTrainerProps> = ({
  settings,
  onKeyingStateChange,
}) => {
  const [keyerType, setKeyerType] = useState<KeyerType>('straight');
  const [isKeyPressed, setIsKeyPressed] = useState<boolean>(false);
  const [currentBuffer, setCurrentBuffer] = useState<string>(''); // e.g. ".-."
  const [decodedText, setDecodedText] = useState<string>('');
  const [recentPulses, setRecentPulses] = useState<{ type: 'dit' | 'dah'; duration: number }[]>([]);
  const [targetSentence, setTargetSentence] = useState<string>('CQ CQ DE VU2XYZ K');
  const [ratioFeedback, setRatioFeedback] = useState<string>('Ready to key');

  // Key timing refs
  const keyPressStartTime = useRef<number>(0);
  const lastReleaseTime = useRef<number>(0);
  const letterTimeoutRef = useRef<number | null>(null);
  const wordTimeoutRef = useRef<number | null>(null);
  const iambicIntervalRef = useRef<number | null>(null);

  // Iambic paddle state
  const paddleDitPressed = useRef<boolean>(false);
  const paddleDahPressed = useRef<boolean>(false);

  // Timing thresholds based on current target WPM
  const timing = audioEngine.calculateTiming(settings.charWpm, settings.effectiveWpm);
  const ditThresholdMs = timing.ditMs * 1.8; // Anything below this is classified as a dit

  // Append a detected symbol (dit or dah) to current letter buffer
  const appendSymbol = useCallback((symbol: '.' | '-') => {
    setCurrentBuffer((prev) => prev + symbol);

    if (letterTimeoutRef.current) clearTimeout(letterTimeoutRef.current);
    if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);

    // After letter gap (3 dits equivalent), finalize character
    letterTimeoutRef.current = window.setTimeout(() => {
      setCurrentBuffer((currentMorse) => {
        if (!currentMorse) return '';
        const decodedChar = REVERSE_MORSE_TABLE[currentMorse] || '';
        setDecodedText((prev) => prev + decodedChar);
        return '';
      });

      // After word gap (7 dits equivalent), add space
      wordTimeoutRef.current = window.setTimeout(() => {
        setDecodedText((prev) => (prev.endsWith(' ') ? prev : prev + ' '));
      }, timing.wordSpaceMs);
    }, timing.charSpaceMs);
  }, [timing.charSpaceMs, timing.wordSpaceMs]);

  // Press Straight Key
  const handleKeyDown = useCallback(() => {
    if (isKeyPressed) return;
    setIsKeyPressed(true);
    onKeyingStateChange(true);
    keyPressStartTime.current = performance.now();

    if (letterTimeoutRef.current) clearTimeout(letterTimeoutRef.current);
    if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);

    audioEngine.initAudio().then(() => {
      audioEngine.startManualTone();
    });
  }, [isKeyPressed, onKeyingStateChange]);

  // Release Straight Key
  const handleKeyUp = useCallback(() => {
    if (!isKeyPressed) return;
    setIsKeyPressed(false);
    onKeyingStateChange(false);
    const durationMs = audioEngine.stopManualTone();
    lastReleaseTime.current = performance.now();

    // Determine if it was dit or dah
    const isDah = durationMs > ditThresholdMs;
    const pulseType: 'dit' | 'dah' = isDah ? 'dah' : 'dit';

    appendSymbol(isDah ? '-' : '.');

    setRecentPulses((prev) => [
      ...prev.slice(-12),
      { type: pulseType, duration: Math.round(durationMs) },
    ]);

    // Calculate rhythm ratio feedback
    const idealDuration = isDah ? timing.dahMs : timing.ditMs;
    const deviationRatio = durationMs / idealDuration;
    if (deviationRatio < 0.7) {
      setRatioFeedback(isDah ? 'Dah was clipped short' : 'Dit was very brief');
    } else if (deviationRatio > 1.4) {
      setRatioFeedback(isDah ? 'Dah held too long' : 'Dit too slow (approaching dah)');
    } else {
      setRatioFeedback(`Good rhythm (~${Math.round(durationMs)}ms)`);
    }
  }, [isKeyPressed, ditThresholdMs, appendSymbol, timing.dahMs, timing.ditMs, onKeyingStateChange]);

  // Global Keyboard event listener for Spacebar (Straight key) and '[' / ']' (Iambic)
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      // Avoid keying if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (keyerType === 'straight' && (e.code === 'Space' || e.code === 'KeyK')) {
        e.preventDefault();
        handleKeyDown();
      } else if (keyerType !== 'straight') {
        if (e.code === 'BracketLeft' || e.code === 'KeyZ') {
          paddleDitPressed.current = true;
        }
        if (e.code === 'BracketRight' || e.code === 'Slash') {
          paddleDahPressed.current = true;
        }
      }
    };

    const onGlobalKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (keyerType === 'straight' && (e.code === 'Space' || e.code === 'KeyK')) {
        e.preventDefault();
        handleKeyUp();
      } else if (keyerType !== 'straight') {
        if (e.code === 'BracketLeft' || e.code === 'KeyZ') {
          paddleDitPressed.current = false;
        }
        if (e.code === 'BracketRight' || e.code === 'Slash') {
          paddleDahPressed.current = false;
        }
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    window.addEventListener('keyup', onGlobalKeyUp);

    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown);
      window.removeEventListener('keyup', onGlobalKeyUp);
    };
  }, [keyerType, handleKeyDown, handleKeyUp]);

  // Handle Iambic auto-pulse generator
  useEffect(() => {
    if (keyerType === 'straight') {
      if (iambicIntervalRef.current) clearInterval(iambicIntervalRef.current);
      return;
    }

    const cycleMs = timing.ditMs + timing.intraCharMs;
    iambicIntervalRef.current = window.setInterval(() => {
      const ditDown = paddleDitPressed.current;
      const dahDown = paddleDahPressed.current;

      if (ditDown && !dahDown) {
        audioEngine.playTone(timing.ditMs / 1000);
        appendSymbol('.');
      } else if (dahDown && !ditDown) {
        audioEngine.playTone(timing.dahMs / 1000);
        appendSymbol('-');
      } else if (ditDown && dahDown) {
        // Squeeze keying alternate
        audioEngine.playTone(timing.ditMs / 1000);
        appendSymbol('.');
        setTimeout(() => {
          audioEngine.playTone(timing.dahMs / 1000);
          appendSymbol('-');
        }, timing.ditMs + timing.intraCharMs);
      }
    }, cycleMs * 2);

    return () => {
      if (iambicIntervalRef.current) clearInterval(iambicIntervalRef.current);
    };
  }, [keyerType, timing, appendSymbol]);

  const clearDecoded = () => {
    setDecodedText('');
    setCurrentBuffer('');
    setRecentPulses([]);
    setRatioFeedback('Cleared');
  };

  const calculateTargetMatch = () => {
    const cleanTarget = targetSentence.replace(/\s+/g, '').toUpperCase();
    const cleanUser = decodedText.replace(/\s+/g, '').toUpperCase();
    if (cleanUser.length === 0) return 0;

    let matches = 0;
    for (let i = 0; i < cleanUser.length; i++) {
      if (cleanUser[i] === cleanTarget[i]) {
        matches++;
      }
    }
    return Math.round((matches / Math.max(cleanTarget.length, cleanUser.length)) * 100);
  };

  const matchAccuracy = calculateTargetMatch();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Keyer Type Bar */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Transmission Station (TX)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Morse Sending & Keying Trainer</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setKeyerType('straight')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                keyerType === 'straight'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#181b26] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Straight Key (Manual)
            </button>
            <button
              onClick={() => setKeyerType('iambic-a')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                keyerType !== 'straight'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#181b26] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Electronic Iambic Paddle
            </button>
          </div>
        </div>

        {/* Target Transmission Challenge */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#171924] p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Transmission Target Practice
            </div>
            <div className="font-mono text-lg font-bold text-amber-400 tracking-wider mt-0.5">
              {targetSentence}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Target Match</span>
              <div className="text-lg font-bold font-mono text-emerald-400">{matchAccuracy}%</div>
            </div>
            <button
              onClick={() => {
                const phrases = [
                  'CQ CQ DE VU2XYZ K',
                  'UR RST 599 599 73',
                  'WX SUNNY TEMP 28C',
                  'QSL VIA BUREAU ES 73',
                  'ASOC EXAM TEST OK',
                ];
                setTargetSentence(phrases[Math.floor(Math.random() * phrases.length)]);
                clearDecoded();
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              Change Target
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Keying Surface */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-6 shadow-xl">
        {/* Straight Key Mode */}
        {keyerType === 'straight' ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-center mb-6">
              <span className="text-xs font-mono uppercase text-slate-400">
                Operate using <strong>[Spacebar]</strong> or <strong>[Click / Hold Pad]</strong>
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Target Cadence: {settings.charWpm} WPM (Dit = ~{Math.round(timing.ditMs)}ms, Dah = ~{Math.round(timing.dahMs)}ms)
              </p>
            </div>

            {/* Tactile Hardware Straight Key Pad */}
            <button
              type="button"
              onMouseDown={handleKeyDown}
              onMouseUp={handleKeyUp}
              onTouchStart={(e) => {
                e.preventDefault();
                handleKeyDown();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleKeyUp();
              }}
              className={`relative flex h-44 w-72 flex-col items-center justify-center rounded-3xl border-2 transition-all select-none shadow-2xl ${
                isKeyPressed
                  ? 'border-emerald-400 bg-gradient-to-b from-emerald-600/30 to-emerald-950/60 translate-y-2 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                  : 'border-slate-700 bg-gradient-to-b from-[#1e2233] to-[#12141e] hover:border-slate-500 active:translate-y-2'
              }`}
            >
              {/* Hardware Brass Pivot & Knob representation */}
              <div
                className={`h-16 w-16 rounded-full border-4 transition-all shadow-inner ${
                  isKeyPressed
                    ? 'border-emerald-400 bg-emerald-500/40 scale-95'
                    : 'border-amber-500/70 bg-gradient-to-br from-amber-600 to-amber-800'
                }`}
              />
              <span
                className={`mt-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors ${
                  isKeyPressed ? 'text-emerald-300' : 'text-slate-300'
                }`}
              >
                {isKeyPressed ? 'CARRIER ACTIVE (ON)' : 'PRESS TO TRANSMIT'}
              </span>
            </button>
          </div>
        ) : (
          /* Electronic Iambic Paddle Mode */
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-center mb-6">
              <span className="text-xs font-mono uppercase text-slate-400">
                Paddles: <strong>Left [Z] or [[]</strong> for Dit • <strong>Right [/] or []]</strong> for Dah
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Auto-pulse generated at calibrated {settings.charWpm} WPM with Squeeze Keying
              </p>
            </div>

            <div className="flex gap-6">
              {/* Dit Paddle */}
              <button
                type="button"
                onMouseDown={() => {
                  paddleDitPressed.current = true;
                }}
                onMouseUp={() => {
                  paddleDitPressed.current = false;
                }}
                className="flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-[#1a1d2c] hover:bg-[#202538] active:translate-y-1 shadow-lg"
              >
                <div className="h-6 w-6 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                <span className="mt-2 font-mono text-sm font-bold text-white">DIT PADDLE</span>
                <span className="text-[10px] font-mono text-slate-400">[Key Z / []</span>
              </button>

              {/* Dah Paddle */}
              <button
                type="button"
                onMouseDown={() => {
                  paddleDahPressed.current = true;
                }}
                onMouseUp={() => {
                  paddleDahPressed.current = false;
                }}
                className="flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-[#1a1d2c] hover:bg-[#202538] active:translate-y-1 shadow-lg"
              >
                <div className="h-4 w-12 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                <span className="mt-3 font-mono text-sm font-bold text-white">DAH PADDLE</span>
                <span className="text-[10px] font-mono text-slate-400">[Key / / ]]</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-time Rhythm & Timing Feedback Gauge */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#0d0f17] p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">Rhythm Cadence:</span>
            <span className="font-bold text-emerald-400">{ratioFeedback}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Buffer: </span>
            <span className="font-mono text-amber-400 text-sm font-bold tracking-widest min-w-8">
              {currentBuffer || '—'}
            </span>
          </div>
        </div>

        {/* Recent Pulses Visual Strip */}
        <div className="mt-4">
          <span className="text-[10px] font-mono uppercase text-slate-500">Pulse Stream (Last 12)</span>
          <div className="mt-1.5 flex h-10 items-center gap-1.5 rounded-lg border border-slate-800 bg-[#090b10] px-3 overflow-x-auto">
            {recentPulses.length === 0 ? (
              <span className="text-xs text-slate-600 font-mono">No pulses recorded yet...</span>
            ) : (
              recentPulses.map((p, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                    p.type === 'dit'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <span>{p.type === 'dit' ? '•' : '—'}</span>
                  <span className="text-[8px] opacity-70">{p.duration}ms</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Decoded Output Stream */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c0d14] p-5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">
            <span>Live Decoded Telegraphic Stream</span>
            <button
              onClick={clearDecoded}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
          <div className="font-mono text-2xl tracking-widest text-emerald-400 min-h-12 flex items-center break-all select-all">
            {decodedText || (
              <span className="text-slate-600 text-sm font-sans italic">
                Decoded characters will appear here as you key...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
