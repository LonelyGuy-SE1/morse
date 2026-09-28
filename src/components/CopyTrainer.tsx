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

export const CopyTrainer: React.FC<CopyTrainerProps> = ({ settings, onStatsUpdate }) => {
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

  // Generate next target text based on selected mode
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
        // Generate two 5-character groups
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

  // Audio Playback
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

  // Keyboard shortcut listener (Ctrl+R / F2 to repeat audio)
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

  // Check user answer
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
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Practice Category Selector */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Reception Audio Trainer (RX)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">CW Copy Practice</h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Accuracy: <strong className="text-emerald-400 font-mono text-sm">
              {sessionCount > 0 ? Math.round((correctCount / sessionCount) * 100) : 0}%
            </strong></span>
            <span>Completed: <strong className="text-white font-mono text-sm">{sessionCount}</strong></span>
          </div>
        </div>

        {/* Source Mode Tabs */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'random-groups', label: '5-Letter Groups', icon: <Hash className="h-4 w-4" /> },
            { id: 'callsigns', label: 'Callsigns (VU/DX)', icon: <Radio className="h-4 w-4" /> },
            { id: 'q-codes', label: 'Q-Codes & CW Slang', icon: <Volume2 className="h-4 w-4" /> },
            { id: 'words', label: 'Common Words', icon: <FileText className="h-4 w-4" /> },
            { id: 'custom', label: 'Custom Text', icon: <FileText className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceType(tab.id as CopySourceType)}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-semibold transition-all ${
                sourceType === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#181b26] text-slate-400 hover:bg-[#202534] hover:text-white border border-slate-800'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Text Input if mode is custom */}
        {sourceType === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Custom Morse Text to Transmit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                placeholder="Enter text to convert to Morse..."
                className="flex-1 rounded-xl border border-slate-700 bg-[#161824] px-4 py-2 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={generateNextTarget}
                className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-xs text-slate-950 hover:bg-amber-400"
              >
                Apply Text
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const msg = ASOC_PLAIN_MESSAGES[Math.floor(Math.random() * ASOC_PLAIN_MESSAGES.length)];
                  setCustomText(msg);
                }}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-mono"
              >
                + Load ASOC Telegram Message Sample
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audio Playback & Interactive Typing Field */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-6 shadow-xl">
        {/* Playback & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            {!isPlaying ? (
              <button
                onClick={handlePlayCurrent}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Play Sound (Ctrl+R)</span>
              </button>
            ) : (
              <button
                onClick={handlePlayCurrent}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 transition-all active:scale-95"
              >
                <Square className="h-5 w-5 fill-current" />
                <span>Stop Audio</span>
              </button>
            )}

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#181a26] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showAnswer ? 'Hide Text' : 'Peek Answer'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-[#1e2235] border border-slate-700 px-5 py-3 font-semibold text-xs text-white hover:bg-slate-700 transition-all active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Next Sample</span>
            </button>
          </div>
        </div>

        {/* Revealed Target Text Display */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c0d14] p-5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">
            <span>Transmission Stream</span>
            {showAnswer && <span className="text-amber-400 font-semibold">Revealed</span>}
          </div>
          <div className="font-mono text-2xl tracking-widest min-h-10 flex items-center">
            {showAnswer ? (
              <div className="flex flex-wrap gap-2 text-white">
                {currentItem.split('').map((char, idx) => (
                  <span
                    key={idx}
                    className={`transition-colors ${
                      idx === currentCharIdx ? 'text-amber-400 font-black scale-110 underline' : ''
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex gap-1.5 text-slate-600 select-none">
                {currentItem.split('').map((_, i) => (
                  <span key={i} className="inline-block h-6 w-3 border-b-2 border-slate-700" />
                ))}
                <span className="text-xs text-slate-500 ml-2 self-center font-sans italic">
                  (Audio hidden - listen and type below)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Copy Scratchpad Input */}
        <div className="mt-5">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
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
              className="flex-1 rounded-xl border border-slate-700 bg-[#161824] px-4 py-3 font-mono text-lg tracking-widest text-amber-300 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none uppercase"
            />
            <button
              onClick={handleCheck}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
            >
              Verify
            </button>
          </div>
        </div>

        {/* Evaluation Feedback */}
        {feedback && (
          <div className={`mt-5 rounded-xl border p-4 flex items-center justify-between ${
            feedback.isCorrect 
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' 
              : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {feedback.isCorrect ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 border border-rose-500/30">
                  <X className="h-5 w-5 text-rose-400" />
                </div>
              )}
              <span className="font-mono font-bold text-sm">{feedback.message}</span>
            </div>

            <button
              onClick={handleNext}
              className="rounded-lg bg-amber-500 px-4 py-1.5 font-bold text-xs text-slate-950 hover:bg-amber-400"
            >
              Next Sample →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
