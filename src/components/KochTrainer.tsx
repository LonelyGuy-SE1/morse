import { useState, useEffect, useRef, useCallback } from 'react';
import { KOCH_LESSONS, MORSE_TABLE, generateRandomGroups } from '../utils/morseData';
import { audioEngine } from '../services/audioEngine';
import { StorageService } from '../services/storageService';
import type { AudioSettings } from '../types/morse';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface KochTrainerProps {
  settings: AudioSettings;
  onStatsUpdate: () => void;
}

export const KochTrainer: React.FC<KochTrainerProps> = ({ settings, onStatsUpdate }) => {
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [lessonGroups, setLessonGroups] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(-1);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{
    totalChars: number;
    correctChars: number;
    accuracy: number;
    passed: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionStartTime = useRef<number>(0);

  // Load progress
  useEffect(() => {
    const stats = StorageService.getStats();
    setUnlockedLevel(stats.kochLevelUnlocked || 1);
    setCurrentLevel(stats.kochLevelUnlocked || 1);
  }, []);

  const activeLesson = KOCH_LESSONS[currentLevel - 1] || KOCH_LESSONS[0];

  // Generate new exercise for this lesson
  const generateNewExercise = useCallback(() => {
    audioEngine.stopSequence();
    setIsPlaying(false);
    setCurrentCharIndex(-1);
    setIsFinished(false);
    setScoreResult(null);
    setUserInput('');

    // 5 groups of 5 characters = 25 characters standard lesson length
    const groups = generateRandomGroups(5, activeLesson.allChars);
    setLessonGroups(groups);
  }, [activeLesson.allChars]);

  useEffect(() => {
    generateNewExercise();
  }, [currentLevel, generateNewExercise]);

  const targetText = lessonGroups.join(' ');

  // Play single character sample
  const handleHearChar = (char: string) => {
    audioEngine.playSequence(char);
  };

  // Start audio playback
  const handleStartPlayback = async () => {
    if (isPlaying) {
      audioEngine.stopSequence();
      setIsPlaying(false);
      return;
    }

    sessionStartTime.current = Date.now();
    setIsPlaying(true);
    setIsFinished(false);
    setScoreResult(null);
    setUserInput('');
    setCurrentCharIndex(-1);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    await audioEngine.playSequence(
      targetText,
      (idx) => {
        setCurrentCharIndex(idx);
      },
      () => {
        setIsPlaying(false);
        setCurrentCharIndex(-1);
      }
    );
  };

  const handleStopPlayback = () => {
    audioEngine.stopSequence();
    setIsPlaying(false);
    setCurrentCharIndex(-1);
  };

  // Evaluate user submission
  const handleEvaluate = () => {
    audioEngine.stopSequence();
    setIsPlaying(false);

    const cleanTarget = targetText.replace(/\s+/g, '');
    const cleanInput = userInput.toUpperCase().replace(/\s+/g, '');

    let correct = 0;
    const charStats: Record<string, { correct: boolean }> = {};

    for (let i = 0; i < cleanTarget.length; i++) {
      const targetChar = cleanTarget[i];
      const userChar = cleanInput[i];
      const isMatch = targetChar === userChar;
      if (isMatch) correct++;

      charStats[targetChar] = { correct: isMatch };
    }

    const accuracy = Math.round((correct / Math.max(cleanTarget.length, 1)) * 100);
    const passed = accuracy >= 90;

    const result = {
      totalChars: cleanTarget.length,
      correctChars: correct,
      accuracy,
      passed,
    };

    setScoreResult(result);
    setIsFinished(true);

    const durationSec = Math.round((Date.now() - sessionStartTime.current) / 1000);
    StorageService.recordSession(
      `Koch Lesson ${currentLevel}`,
      accuracy,
      settings.charWpm,
      cleanTarget.length,
      durationSec,
      charStats
    );

    if (passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (currentLevel === unlockedLevel && unlockedLevel < 40) {
        const nextLevel = unlockedLevel + 1;
        setUnlockedLevel(nextLevel);
        StorageService.unlockKochLevel(nextLevel);
      }
    }

    onStatsUpdate();
  };

  const handleNextLevel = () => {
    if (currentLevel < 40) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Level Selector Bar */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentLevel((prev) => Math.max(1, prev - 1))}
              disabled={currentLevel === 1}
              aria-label="Previous lesson"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Koch Method Curriculum
                </span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                  Lesson {currentLevel} of 40
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Target Letter: <span className="text-amber-400 font-mono text-2xl ml-1">{activeLesson.newChar}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentLevel((prev) => Math.min(unlockedLevel, prev + 1))}
              disabled={currentLevel >= unlockedLevel || currentLevel === 40}
              aria-label="Next lesson"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Level Pills Carousel */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {KOCH_LESSONS.map((les) => {
            const isUnlocked = les.level <= unlockedLevel;
            const isCurrent = les.level === currentLevel;
            return (
              <button
                key={les.level}
                onClick={() => isUnlocked && setCurrentLevel(les.level)}
                disabled={!isUnlocked}
                className={`flex h-10 min-w-10 flex-col items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                    : isUnlocked
                    ? 'bg-[#181b26] text-slate-300 hover:bg-[#202534] border border-slate-800'
                    : 'bg-[#0f1118] text-slate-600 border border-slate-900 cursor-not-allowed'
                }`}
              >
                <span>{les.newChar}</span>
                <span className="text-[9px] font-normal opacity-70">
                  {isUnlocked ? les.level : <Lock className="h-2.5 w-2.5 inline" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson Details & New Character Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Character Spotlight */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#181a26] to-[#12141e] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-8xl font-black text-amber-400">
            {activeLesson.newChar}
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
            Newly Introduced Tone
          </span>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-5xl font-black text-white">{activeLesson.newChar}</span>
            <span className="font-mono text-2xl font-bold tracking-widest text-amber-400">
              {MORSE_TABLE[activeLesson.newChar] || ''}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Listen to its rhythm as a distinct musical phrase at {settings.charWpm} WPM. Never count dots!
          </p>

          <button
            onClick={() => handleHearChar(activeLesson.newChar)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Volume2 className="h-4 w-4" />
            Play Sound Preview
          </button>
        </div>

        {/* Current Active Character Pool */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-[#12141d] p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Active Letter Pool ({activeLesson.allChars.length} Characters)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Pass Threshold: 90%
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeLesson.allChars.map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleHearChar(ch)}
                  title={`Play ${ch} (${MORSE_TABLE[ch]})`}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold border transition-colors ${
                    ch === activeLesson.newChar
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-[#181a26] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span>{ch}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{MORSE_TABLE[ch]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400 font-mono">
            <span>Character Cadence: <strong className="text-white">{settings.charWpm} WPM</strong></span>
            <span>Farnsworth Spacing: <strong className="text-cyan-400">{settings.effectiveWpm} WPM</strong></span>
          </div>
        </div>
      </div>

      {/* Practice & Transcription Station */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-6 shadow-xl">
        {/* Playback Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            {!isPlaying ? (
              <button
                onClick={handleStartPlayback}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Start Audio Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStopPlayback}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 transition-all active:scale-95"
              >
                <Square className="h-5 w-5 fill-current" />
                <span>Halt Audio</span>
              </button>
            )}

            <button
              onClick={generateNewExercise}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#181a26] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>New Groups</span>
            </button>
          </div>

          <div className="font-mono text-xs text-slate-400">
            Standard: 5 groups of 5 letters (25 total)
          </div>
        </div>

        {/* Real-time Visual Transmission Display */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-[#0c0d14] p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">
            Target Stream
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-2xl tracking-widest text-slate-300 select-none">
            {lessonGroups.map((group, gIdx) => (
              <div key={gIdx} className="rounded-lg bg-[#141620] px-3 py-1.5 border border-slate-800">
                {group.split('').map((char, cIdx) => {
                  const globalIdx = gIdx * 6 + cIdx;
                  const isCurrent = globalIdx === currentCharIndex;
                  return (
                    <span
                      key={cIdx}
                      className={`inline-block transition-all ${
                        isCurrent
                          ? 'text-amber-400 scale-125 font-black underline decoration-amber-400 decoration-2'
                          : isFinished
                          ? 'text-slate-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* User Input & Scratchpad */}
        <div className="mt-5">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Transcription Scratchpad (Type what you hear)
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEvaluate();
                }
              }}
              placeholder="Listen and type letters continuously..."
              className="flex-1 rounded-xl border border-slate-700 bg-[#161824] px-4 py-3 font-mono text-lg tracking-widest text-amber-300 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
            />
            <button
              onClick={handleEvaluate}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-95 whitespace-nowrap"
            >
              Verify Score
            </button>
          </div>
        </div>

        {/* Score & Evaluation Card */}
        {scoreResult && (
          <div className={`mt-6 rounded-xl border p-5 transition-all ${
            scoreResult.passed 
              ? 'border-emerald-500/40 bg-emerald-950/20' 
              : 'border-rose-500/40 bg-rose-950/20'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {scoreResult.passed ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {scoreResult.passed ? 'Lesson Mastered! (≥ 90%)' : 'Needs More Repetition'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Score: {scoreResult.correctChars} / {scoreResult.totalChars} characters correct
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">Accuracy</span>
                  <div className={`text-3xl font-black font-mono ${
                    scoreResult.passed ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {scoreResult.accuracy}%
                  </div>
                </div>

                {scoreResult.passed && currentLevel < 40 && (
                  <button
                    onClick={handleNextLevel}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Advance to Lesson {currentLevel + 1}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
