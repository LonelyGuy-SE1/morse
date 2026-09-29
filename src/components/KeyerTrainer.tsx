import { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import { REVERSE_MORSE_TABLE } from '../utils/morseData';
import type { AudioSettings, KeyerType } from '../types/morse';
import { 
  Trash2, 
  Activity,
  Zap
} from 'lucide-react';

interface KeyerTrainerProps {
  settings: AudioSettings;
  onKeyingStateChange: (active: boolean) => void;
}

export const KeyerTrainer = ({
  settings,
  onKeyingStateChange,
}: KeyerTrainerProps) => {
  const [keyerType, setKeyerType] = useState<KeyerType>('straight');
  const [isKeyPressed, setIsKeyPressed] = useState<boolean>(false);
  const [currentBuffer, setCurrentBuffer] = useState<string>('');
  const [decodedText, setDecodedText] = useState<string>('');
  const [recentPulses, setRecentPulses] = useState<{ type: 'dit' | 'dah'; duration: number }[]>([]);
  const [targetSentence, setTargetSentence] = useState<string>('CQ CQ DE VU2XYZ K');
  const [ratioFeedback, setRatioFeedback] = useState<string>('Ready to key');

  const keyPressStartTime = useRef<number>(0);
  const letterTimeoutRef = useRef<number | null>(null);
  const wordTimeoutRef = useRef<number | null>(null);
  const iambicIntervalRef = useRef<number | null>(null);

  const paddleDitPressed = useRef<boolean>(false);
  const paddleDahPressed = useRef<boolean>(false);

  const isBrutal = true;
  const isDark = false;

  const timing = audioEngine.calculateTiming(settings.charWpm, settings.effectiveWpm);
  const ditThresholdMs = timing.ditMs * 1.8;

  const appendSymbol = useCallback((symbol: '.' | '-') => {
    setCurrentBuffer((prev) => prev + symbol);

    if (letterTimeoutRef.current) clearTimeout(letterTimeoutRef.current);
    if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);

    letterTimeoutRef.current = window.setTimeout(() => {
      setCurrentBuffer((currentMorse) => {
        if (!currentMorse) return '';
        const decodedChar = REVERSE_MORSE_TABLE[currentMorse] || '';
        setDecodedText((prev) => prev + decodedChar);
        return '';
      });

      wordTimeoutRef.current = window.setTimeout(() => {
        setDecodedText((prev) => (prev.endsWith(' ') ? prev : prev + ' '));
      }, timing.wordSpaceMs);
    }, timing.charSpaceMs);
  }, [timing.charSpaceMs, timing.wordSpaceMs]);

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

  const handleKeyUp = useCallback(() => {
    if (!isKeyPressed) return;
    setIsKeyPressed(false);
    onKeyingStateChange(false);
    const durationMs = audioEngine.stopManualTone();

    const isDah = durationMs > ditThresholdMs;
    const pulseType: 'dit' | 'dah' = isDah ? 'dah' : 'dit';

    appendSymbol(isDah ? '-' : '.');

    setRecentPulses((prev) => [
      ...prev.slice(-12),
      { type: pulseType, duration: Math.round(durationMs) },
    ]);

    const idealDuration = isDah ? timing.dahMs : timing.ditMs;
    const deviationRatio = durationMs / idealDuration;
    if (deviationRatio < 0.7) {
      setRatioFeedback(isDah ? 'Dah clipped short' : 'Dit very short');
    } else if (deviationRatio > 1.4) {
      setRatioFeedback(isDah ? 'Dah held too long' : 'Dit slow (nearing dah)');
    } else {
      setRatioFeedback(`Good rhythm (~${Math.round(durationMs)}ms)`);
    }
  }, [isKeyPressed, ditThresholdMs, appendSymbol, timing.dahMs, timing.ditMs, onKeyingStateChange]);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

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
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

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
    setRatioFeedback('Ready to key');
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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Keyer Navigation & Target Challenge */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 border-inherit">
          <div>
            <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
              isBrutal ? 'text-[#ff5500]' : isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Telegraphic Sending Station (TX)
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">Morse Keying & Rhythm Lab</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setKeyerType('straight')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                keyerType === 'straight'
                  ? isBrutal
                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]'
                    : isDark
                    ? 'bg-white text-neutral-950 shadow-md font-semibold'
                    : 'bg-neutral-900 text-white shadow-sm font-semibold'
                  : isBrutal
                  ? 'bg-[#f5f4ee] text-neutral-900 border-2 border-neutral-900 hover:bg-[#ffcc00]'
                  : 'bg-neutral-500/10 text-neutral-400 hover:text-white'
              }`}
            >
              Straight Key (Manual)
            </button>
            <button
              onClick={() => setKeyerType('iambic-a')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                keyerType !== 'straight'
                  ? isBrutal
                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]'
                    : isDark
                    ? 'bg-white text-neutral-950 shadow-md font-semibold'
                    : 'bg-neutral-900 text-white shadow-sm font-semibold'
                  : isBrutal
                  ? 'bg-[#f5f4ee] text-neutral-900 border-2 border-neutral-900 hover:bg-[#ffcc00]'
                  : 'bg-neutral-500/10 text-neutral-400 hover:text-white'
              }`}
            >
              Electronic Iambic Paddle
            </button>
          </div>
        </div>

        {/* Challenge Target Card */}
        <div className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${
          isBrutal
            ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
            : isDark
            ? 'bg-[#0d0d11] border border-white/[0.06]'
            : 'bg-neutral-50 border border-neutral-200'
        }`}>
          <div>
            <div className="text-[10px] font-mono uppercase font-bold opacity-60">
              Transmission Target Practice
            </div>
            <div className="font-mono text-lg font-black tracking-wider mt-0.5 text-[#ff5500]">
              {targetSentence}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase opacity-60">Accuracy</span>
              <div className="font-mono text-xl font-black">{matchAccuracy}%</div>
            </div>
            <button
              onClick={() => {
                const phrases = [
                  'CQ CQ DE VU2XYZ K',
                  'UR RST 599 599 73',
                  'WX SUNNY TEMP 28C',
                  'QSL VIA BUREAU ES 73',
                  'SPEED EXAM TEST OK',
                  'DE VU3ABC 73 SK',
                ];
                setTargetSentence(phrases[Math.floor(Math.random() * phrases.length)]);
                clearDecoded();
              }}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl ${
                isBrutal ? 'bg-white border-2 border-neutral-900 shadow-[1px_1px_0px_0px_#18181b]' : 'bg-neutral-200/50'
              }`}
            >
              New Target
            </button>
          </div>
        </div>
      </div>

      {/* Physical Keyer Surface */}
      <div className={`p-8 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[6px_6px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-2xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-md'
      }`}>
        {keyerType === 'straight' ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-center mb-6">
              <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">
                Operate using <strong>[Spacebar]</strong> or <strong>[Tap & Hold Brass Pad]</strong>
              </span>
              <p className="text-[11px] font-mono opacity-50 mt-1">
                Target Cadence: {settings.charWpm} WPM (Dit = ~{Math.round(timing.ditMs)}ms, Dah = ~{Math.round(timing.dahMs)}ms)
              </p>
            </div>

            {/* Tactile Hardware Straight Key Button */}
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
              className={`relative flex h-48 w-80 flex-col items-center justify-center select-none transition-all ${
                isBrutal
                  ? isKeyPressed
                    ? 'rounded-3xl border-2 border-neutral-900 bg-[#ff5500] text-white translate-x-[4px] translate-y-[4px] shadow-[0px_0px_0px_0px_#18181b]'
                    : 'rounded-3xl border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[6px_6px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                  : isDark
                  ? isKeyPressed
                    ? 'rounded-3xl border-2 border-blue-500 bg-blue-600/30 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] scale-95'
                    : 'rounded-3xl border border-white/[0.1] bg-white/[0.05] text-white hover:bg-white/[0.08] shadow-xl'
                  : isKeyPressed
                  ? 'rounded-3xl border-2 border-blue-600 bg-blue-50 text-blue-900 scale-95 shadow-inner'
                  : 'rounded-3xl border border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-md'
              }`}
            >
              <div className={`h-16 w-16 rounded-full border-4 flex items-center justify-center transition-all ${
                isKeyPressed
                  ? 'border-neutral-900 bg-white scale-90'
                  : isBrutal
                  ? 'border-neutral-900 bg-[#ff5500]'
                  : 'border-blue-400 bg-blue-500/20'
              }`}>
                <Zap className={`h-7 w-7 ${isKeyPressed ? 'fill-neutral-900 text-neutral-900' : 'text-white'}`} />
              </div>

              <span className="mt-4 font-mono text-xs font-black tracking-widest uppercase">
                {isKeyPressed ? 'CARRIER ACTIVE (ON)' : 'PRESS TO TRANSMIT'}
              </span>
            </button>
          </div>
        ) : (
          /* Electronic Iambic Paddle Mode */
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-center mb-6">
              <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">
                Paddles: <strong>Left [Z] / [[]</strong> for Dit • <strong>Right [/] / []]</strong> for Dah
              </span>
              <p className="text-[11px] font-mono opacity-50 mt-1">
                Auto-pulsed at calibrated {settings.charWpm} WPM with Squeeze Keying
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
                className={`flex h-40 w-40 flex-col items-center justify-center rounded-3xl transition-all ${
                  isBrutal
                    ? 'border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#18181b]'
                    : 'border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08] active:scale-95 shadow-xl text-white'
                }`}
              >
                <div className="h-6 w-6 rounded-full bg-[#ff5500] mb-2" />
                <span className="font-mono text-sm font-black">DIT PADDLE</span>
                <span className="text-[10px] font-mono opacity-60">[Key Z / []</span>
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
                className={`flex h-40 w-40 flex-col items-center justify-center rounded-3xl transition-all ${
                  isBrutal
                    ? 'border-2 border-neutral-900 bg-[#ff5500] text-white shadow-[4px_4px_0px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#18181b]'
                    : 'border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08] active:scale-95 shadow-xl text-white'
                }`}
              >
                <div className="h-3 w-10 rounded-full bg-emerald-400 mb-3" />
                <span className="font-mono text-sm font-black">DAH PADDLE</span>
                <span className="text-[10px] font-mono opacity-60">[Key / / ]]</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-time Rhythm & Buffer Status */}
        <div className={`mt-4 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs font-bold transition-all ${
          isBrutal
            ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
            : isDark
            ? 'bg-[#0d0d11] border border-white/[0.06]'
            : 'bg-neutral-50 border border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#ff5500]" />
            <span className="opacity-60">Rhythm Cadence:</span>
            <span className="font-black text-[#ff5500]">{ratioFeedback}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-60">Morse Buffer:</span>
            <span className="font-mono text-base font-black tracking-widest text-[#ff5500] min-w-8">
              {currentBuffer || '—'}
            </span>
          </div>
        </div>

        {/* Pulse Strip */}
        <div className="mt-4">
          <span className="text-[10px] font-mono uppercase opacity-60 font-bold">Recent Key Pulses</span>
          <div className={`mt-1.5 flex h-12 items-center gap-1.5 px-3 overflow-x-auto rounded-xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-neutral-900/50 border border-neutral-800'
          }`}>
            {recentPulses.length === 0 ? (
              <span className="text-xs opacity-50 font-mono">Tap key above to record pulses...</span>
            ) : (
              recentPulses.map((p, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                    p.type === 'dit'
                      ? 'bg-[#ffcc00] text-neutral-900 border border-neutral-900'
                      : 'bg-[#ff5500] text-white border border-neutral-900'
                  }`}
                >
                  <span>{p.type === 'dit' ? '•' : '—'}</span>
                  <span className="text-[8px] opacity-80">{p.duration}ms</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Decoded Output */}
        <div className={`mt-6 p-6 rounded-2xl transition-all ${
          isBrutal
            ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
            : isDark
            ? 'bg-[#0d0d11] border border-white/[0.06]'
            : 'bg-neutral-50 border border-neutral-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider opacity-60 mb-2 font-bold">
            <span>Live Decoded Telegraphic Stream</span>
            <button
              onClick={clearDecoded}
              className="flex items-center gap-1 opacity-70 hover:opacity-100 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
          <div className="font-mono text-2xl font-black tracking-widest min-h-12 flex items-center break-all select-all">
            {decodedText || (
              <span className="opacity-40 text-sm font-sans font-normal italic">
                Decoded characters will appear here as you tap...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
