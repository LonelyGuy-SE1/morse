import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  generateRandomGroups, 
  generateRandomCallsign, 
  generateRandomRadioSnippet,
  ASOC_PLAIN_MESSAGES
} from '../utils/morseData';
import { audioEngine } from '../services/audioEngine';
import { StorageService } from '../services/storageService';
import type { AudioSettings, CopySourceType } from '../types/morse';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Radio, 
  Hash, 
  FileText,
  Volume2
} from 'lucide-react';

interface CopyTrainerProps {
  settings: AudioSettings;
  onStatsUpdate: () => void;
}

export const CopyTrainer = ({ settings, onStatsUpdate }: CopyTrainerProps) => {
  const [sourceType, setSourceType] = useState<CopySourceType>('random-groups');
  const [customText, setCustomText] = useState<string>('CQ CQ CQ DE VU2XYZ PSE K');
  const [currentItem, setCurrentItem] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentCharIdx, setCurrentCharIdx] = useState<number>(-1);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionStartTime = useRef<number>(0);

  const isBrutal = true;
  const isDark = false;

  const generateNextTarget = useCallback(() => {
    audioEngine.stopSequence();
    setIsPlaying(false);
    setCurrentCharIdx(-1);
    setUserInput('');
    setShowAnswer(false);
    setFeedback(null);

    let nextText = '';
    switch (sourceType) {
      case 'random-groups':
        nextText = generateRandomGroups(2).join(' ');
        break;
      case 'callsigns':
        nextText = `${generateRandomCallsign()} ${generateRandomCallsign()}`;
        break;
      case 'q-codes':
        nextText = `${generateRandomRadioSnippet()} ${generateRandomRadioSnippet()}`;
        break;
      case 'words': {
        const words = ['RADIO', 'SIGNAL', 'ANTENNA', 'POWER', 'FREQ', 'KEYER', 'METER', 'ROGER', 'STATION', 'CIRCUIT'];
        const w1 = words[Math.floor(Math.random() * words.length)];
        const w2 = words[Math.floor(Math.random() * words.length)];
        nextText = `${w1} ${w2}`;
        break;
      }
      case 'custom':
        nextText = customText.trim().toUpperCase() || 'CQ CQ CQ DE VU2XYZ';
        break;
      default:
        nextText = generateRandomGroups(2).join(' ');
    }
    setCurrentItem(nextText);
  }, [sourceType, customText]);

  useEffect(() => {
    generateNextTarget();
  }, [sourceType, generateNextTarget]);

  const handlePlayCurrent = async () => {
    if (!currentItem) return;

    if (isPlaying) {
      audioEngine.stopSequence();
      setIsPlaying(false);
      return;
    }

    sessionStartTime.current = Date.now();
    setIsPlaying(true);
    setCurrentCharIdx(-1);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    await audioEngine.playSequence(
      currentItem,
      (idx) => {
        setCurrentCharIdx(idx);
      },
      () => {
        setIsPlaying(false);
        setCurrentCharIdx(-1);
      }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F2') {
        e.preventDefault();
        handlePlayCurrent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentItem, isPlaying]);

  const handleCheck = () => {
    const cleanTarget = currentItem.replace(/\s+/g, '').toUpperCase();
    const cleanUser = userInput.replace(/\s+/g, '').toUpperCase();
    const isMatch = cleanTarget === cleanUser;

    setFeedback({
      isCorrect: isMatch,
      message: isMatch ? 'Perfect Copy!' : `Expected: ${currentItem}`,
    });
    setShowAnswer(true);

    setSessionCount((prev) => prev + 1);
    if (isMatch) {
      setCorrectCount((prev) => prev + 1);
    }

    const durationSec = Math.round((Date.now() - sessionStartTime.current) / 1000);
    StorageService.recordSession(
      `Audio Copy (${sourceType})`,
      isMatch ? 100 : 0,
      settings.charWpm,
      cleanTarget.length,
      durationSec
    );
    onStatsUpdate();
  };

  const handleNext = () => {
    generateNextTarget();
    setTimeout(() => {
      handlePlayCurrent();
    }, 100);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Category Header */}
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
              Audio Reception Trainer (RX)
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">Morse Copy Station</h2>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs font-semibold">
            <span>Accuracy: <strong className={isBrutal ? 'text-[#ff5500]' : 'text-emerald-500'}>
              {sessionCount > 0 ? Math.round((correctCount / sessionCount) * 100) : 0}%
            </strong></span>
            <span>Completed: <strong>{sessionCount}</strong></span>
          </div>
        </div>

        {/* Source Mode Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'random-groups', label: '5-Letter Groups', icon: Hash },
            { id: 'callsigns', label: 'Ham Callsigns', icon: Radio },
            { id: 'q-codes', label: 'Q-Codes & Slang', icon: Volume2 },
            { id: 'words', label: 'Common Words', icon: FileText },
            { id: 'custom', label: 'Custom Text', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = sourceType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSourceType(tab.id as CopySourceType)}
                className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-2xl transition-all ${
                  isTabActive
                    ? isBrutal
                      ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#ff5500]'
                      : isDark
                      ? 'bg-white text-neutral-950 shadow-md font-semibold'
                      : 'bg-neutral-900 text-white shadow-sm font-semibold'
                    : isBrutal
                    ? 'bg-[#f5f4ee] text-neutral-900 border-2 border-neutral-900 hover:bg-[#ffcc00] shadow-[2px_2px_0px_0px_#18181b]'
                    : isDark
                    ? 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] border border-white/[0.08]'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Text Drawer */}
        {sourceType === 'custom' && (
          <div className="mt-4 pt-4 border-t border-inherit">
            <label className="block text-xs font-mono uppercase font-bold opacity-70 mb-1.5">
              Custom Morse Text to Transmit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                placeholder="Enter text..."
                className={`flex-1 px-4 py-2 font-mono text-sm rounded-xl outline-none uppercase ${
                  isBrutal
                    ? 'bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
                    : isDark
                    ? 'bg-white/[0.05] border border-white/[0.1] text-white'
                    : 'bg-neutral-50 border border-neutral-300'
                }`}
              />
              <button
                onClick={generateNextTarget}
                className={`px-4 py-2 font-black text-xs rounded-xl ${
                  isBrutal ? 'bg-[#ff5500] text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-blue-600 text-white'
                }`}
              >
                Apply
              </button>
            </div>
            <button
              onClick={() => {
                const msg = ASOC_PLAIN_MESSAGES[Math.floor(Math.random() * ASOC_PLAIN_MESSAGES.length)];
                setCustomText(msg);
              }}
              className="text-[11px] font-mono mt-2 underline opacity-70 hover:opacity-100 block"
            >
              + Load Sample Telegraph Message
            </button>
          </div>
        )}
      </div>

      {/* Copy Arena */}
      <div className={`p-8 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[6px_6px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-2xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-md'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 mb-5 border-inherit">
          <div className="flex items-center gap-3">
            {!isPlaying ? (
              <button
                onClick={handlePlayCurrent}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${
                  isBrutal
                    ? 'bg-[#ff5500] text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px]'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                }`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Play Sound (Ctrl+R)</span>
              </button>
            ) : (
              <button
                onClick={handlePlayCurrent}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${
                  isBrutal
                    ? 'bg-rose-500 text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b]'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Halt</span>
              </button>
            )}

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className={`flex items-center gap-1.5 px-4 py-3 font-bold text-xs rounded-xl transition-all ${
                isBrutal
                  ? 'bg-[#f5f4ee] text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] hover:bg-[#ffcc00]'
                  : isDark
                  ? 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] border border-white/[0.1]'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showAnswer ? 'Hide' : 'Peek'}</span>
            </button>
          </div>

          <button
            onClick={handleNext}
            className={`flex items-center gap-1.5 px-5 py-3 font-bold text-xs rounded-xl transition-all ${
              isBrutal
                ? 'bg-[#ffcc00] text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                : isDark
                ? 'bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.1]'
                : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Next Sample</span>
          </button>
        </div>

        {/* Revealed / Hidden Text Strip */}
        <div className={`p-6 rounded-2xl mb-6 transition-all ${
          isBrutal
            ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
            : isDark
            ? 'bg-[#0d0d11] border border-white/[0.06]'
            : 'bg-neutral-50 border border-neutral-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider opacity-60 mb-2 font-bold">
            <span>Transmission Stream</span>
            {showAnswer && <span className="text-[#ff5500]">Revealed</span>}
          </div>

          <div className="font-mono text-2xl font-black tracking-widest min-h-10 flex items-center">
            {showAnswer ? (
              <div className="flex flex-wrap gap-2">
                {currentItem.split('').map((char, idx) => (
                  <span
                    key={idx}
                    className={`transition-colors ${
                      idx === currentCharIdx ? 'text-[#ff5500] scale-110 underline decoration-2' : ''
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 opacity-50 select-none">
                {currentItem.split('').map((_, i) => (
                  <span key={i} className="inline-block h-6 w-3 border-b-2 border-current" />
                ))}
                <span className="text-xs ml-3 self-center font-sans italic opacity-75 font-normal">
                  (Audio hidden — transcribe below)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Input Scratchpad */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider font-bold opacity-70 mb-2">
            Your Transcription Copy
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCheck();
                }
              }}
              placeholder="Type what you hear and press Enter..."
              className={`flex-1 px-5 py-3.5 font-mono text-xl font-bold tracking-widest rounded-2xl outline-none uppercase transition-all ${
                isBrutal
                  ? 'bg-white text-neutral-900 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] focus:border-[#ff5500] focus:shadow-[4px_4px_0px_0px_#ff5500]'
                  : isDark
                  ? 'bg-white/[0.04] text-white border border-white/[0.1] focus:border-blue-500 focus:bg-white/[0.06]'
                  : 'bg-white text-neutral-900 border border-neutral-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />
            <button
              onClick={handleCheck}
              className={`px-8 py-3.5 font-black text-sm rounded-2xl transition-all whitespace-nowrap ${
                isBrutal
                  ? 'bg-[#ffcc00] text-neutral-900 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px]'
                  : isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white font-semibold shadow-sm'
              }`}
            >
              Verify
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-5 p-4 rounded-2xl flex items-center justify-between transition-all ${
            feedback.isCorrect
              ? isBrutal
                ? 'border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[3px_3px_0px_0px_#18181b]'
                : 'border border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : isBrutal
              ? 'border-2 border-neutral-900 bg-rose-200 text-neutral-900 shadow-[3px_3px_0px_0px_#18181b]'
              : 'border border-rose-500/40 bg-rose-950/20 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black ${
                feedback.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {feedback.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>
              <span className="font-mono font-bold text-sm">{feedback.message}</span>
            </div>

            <button
              onClick={handleNext}
              className={`px-4 py-2 font-black text-xs rounded-xl ${
                isBrutal ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]' : 'bg-white text-neutral-950'
              }`}
            >
              Next Sample →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
