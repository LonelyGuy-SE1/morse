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
  Lock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface KochTrainerProps {
  settings: AudioSettings;
  onStatsUpdate: () => void;
}

export const KochTrainer = ({ settings, onStatsUpdate }: KochTrainerProps) => {
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => StorageService.getStats().kochLevelUnlocked || 1);
  const [currentLevel, setCurrentLevel] = useState<number>(() => StorageService.getStats().kochLevelUnlocked || 1);
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

  const isBrutal = true;
  const isDark = false;

  const activeLesson = KOCH_LESSONS[currentLevel - 1] || KOCH_LESSONS[0];

  // Generate new exercise
  const generateNewExercise = useCallback(() => {
    audioEngine.stopSequence();
    setIsPlaying(false);
    setCurrentCharIndex(-1);
    setIsFinished(false);
    setScoreResult(null);
    setUserInput('');

    // 5 groups of 5 characters = 25 characters standard lesson
    const groups = generateRandomGroups(5, activeLesson.allChars);
    setLessonGroups(groups);
  }, [activeLesson.allChars]);

  useEffect(() => {
    generateNewExercise();
  }, [currentLevel, generateNewExercise]);

  const targetText = lessonGroups.join(' ');

  const handleHearChar = (char: string) => {
    audioEngine.playSequence(char);
  };

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
        particleCount: 90,
        spread: 80,
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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Level Selection Bar */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 border-inherit">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentLevel((prev) => Math.max(1, prev - 1))}
              disabled={currentLevel === 1}
              aria-label="Previous lesson"
              className={`p-2 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none ${
                isBrutal
                  ? 'border-2 border-neutral-900 bg-[#f5f4ee] hover:bg-[#ffcc00] shadow-[2px_2px_0px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]'
                  : isDark
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
                  isBrutal ? 'text-[#ff5500]' : isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  The Koch Method
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 font-bold rounded-md ${
                  isBrutal
                    ? 'bg-neutral-900 text-white'
                    : isDark
                    ? 'bg-white/[0.08] text-neutral-300'
                    : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}>
                  Lesson {currentLevel} of 40
                </span>
              </div>
              <h2 className="text-xl font-black mt-0.5 tracking-tight">
                Mastering Letter: <span className="font-mono text-2xl ml-1 text-[#ff5500]">{activeLesson.newChar}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentLevel((prev) => Math.min(unlockedLevel, prev + 1))}
              disabled={currentLevel >= unlockedLevel || currentLevel === 40}
              aria-label="Next lesson"
              className={`p-2 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none ${
                isBrutal
                  ? 'border-2 border-neutral-900 bg-[#f5f4ee] hover:bg-[#ffcc00] shadow-[2px_2px_0px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]'
                  : isDark
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Level Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {KOCH_LESSONS.map((les) => {
            const isUnlocked = les.level <= unlockedLevel;
            const isCurrent = les.level === currentLevel;
            return (
              <button
                key={les.level}
                onClick={() => isUnlocked && setCurrentLevel(les.level)}
                disabled={!isUnlocked}
                className={`flex h-11 min-w-11 flex-col items-center justify-center font-mono font-bold transition-all rounded-xl ${
                  isCurrent
                    ? isBrutal
                      ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#ff5500] scale-105'
                      : isDark
                      ? 'bg-white text-neutral-950 font-black shadow-lg scale-105'
                      : 'bg-neutral-900 text-white shadow-md scale-105'
                    : isUnlocked
                    ? isBrutal
                      ? 'bg-[#f5f4ee] text-neutral-900 border-2 border-neutral-900 hover:bg-[#ffcc00]'
                      : isDark
                      ? 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] border border-white/[0.06]'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                    : isBrutal
                    ? 'bg-neutral-200 text-neutral-400 border-2 border-neutral-300 cursor-not-allowed'
                    : 'bg-neutral-900/30 text-neutral-600 border border-neutral-800/40 cursor-not-allowed'
                }`}
              >
                <span className="text-xs">{les.newChar}</span>
                <span className="text-[9px] font-normal opacity-60">
                  {isUnlocked ? les.level : <Lock className="h-2 w-2 inline" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Active Character Card & Active Pool */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spotlight Card */}
        <div className={`p-6 flex flex-col justify-between relative overflow-hidden transition-all ${
          isBrutal
            ? 'rounded-3xl border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b]'
            : isDark
            ? 'rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#1c1c24] to-[#121217] shadow-xl text-white'
            : 'rounded-3xl border border-neutral-200 bg-white shadow-sm text-neutral-900'
        }`}>
          <div>
            <span className="text-[11px] font-mono uppercase font-black tracking-wider opacity-80">
              New Tone Introduced
            </span>
            <div className="mt-2 flex items-baseline gap-4">
              <span className="font-mono text-6xl font-black">{activeLesson.newChar}</span>
              <span className="font-mono text-2xl font-black tracking-widest opacity-80">
                {MORSE_TABLE[activeLesson.newChar] || ''}
              </span>
            </div>
            <p className="mt-2 text-xs opacity-75 font-medium leading-relaxed">
              Listen to the acoustic musical pattern at {settings.charWpm} WPM. Never count dots!
            </p>
          </div>

          <button
            onClick={() => handleHearChar(activeLesson.newChar)}
            className={`mt-5 flex w-full items-center justify-center gap-2 py-3 px-4 font-bold text-xs rounded-xl transition-all ${
              isBrutal
                ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px]'
                : isDark
                ? 'bg-white text-neutral-950 hover:bg-neutral-200 font-semibold shadow-md'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm'
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>Play Tone Preview</span>
          </button>
        </div>

        {/* Active Letter Pool */}
        <div className={`md:col-span-2 p-6 flex flex-col justify-between transition-all ${
          isBrutal
            ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
            : isDark
            ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl text-white'
            : 'rounded-3xl border border-neutral-200 bg-white shadow-sm text-neutral-900'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-3 border-inherit">
              <span className="text-xs font-mono font-black uppercase tracking-wider opacity-70">
                Learned Character Pool ({activeLesson.allChars.length} Total)
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                isBrutal ? 'bg-[#ff5500] text-white' : 'bg-emerald-500/10 text-emerald-400 font-semibold'
              }`}>
                Goal: ≥ 90%
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeLesson.allChars.map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleHearChar(ch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold rounded-xl transition-all ${
                    ch === activeLesson.newChar
                      ? isBrutal
                        ? 'bg-[#ffcc00] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : isBrutal
                      ? 'bg-[#f5f4ee] border-2 border-neutral-900 hover:bg-[#ffcc00] shadow-[1px_1px_0px_0px_#18181b]'
                      : isDark
                      ? 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] border border-white/[0.08]'
                      : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200'
                  }`}
                >
                  <span>{ch}</span>
                  <span className="text-[10px] opacity-60">{MORSE_TABLE[ch]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs font-mono opacity-70">
            <span>Character Cadence: <strong>{settings.charWpm} WPM</strong></span>
            <span>Farnsworth Spacing: <strong>{settings.effectiveWpm} WPM</strong></span>
          </div>
        </div>
      </div>

      {/* Transcription Arena */}
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
                onClick={handleStartPlayback}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${
                  isBrutal
                    ? 'bg-[#ff5500] text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px]'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                }`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Audio Transmission</span>
              </button>
            ) : (
              <button
                onClick={handleStopPlayback}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${
                  isBrutal
                    ? 'bg-rose-500 text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b]'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Halt Transmission</span>
              </button>
            )}

            <button
              onClick={generateNewExercise}
              className={`flex items-center gap-1.5 px-4 py-3 font-bold text-xs rounded-xl transition-all ${
                isBrutal
                  ? 'bg-[#f5f4ee] text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] hover:bg-[#ffcc00]'
                  : isDark
                  ? 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] border border-white/[0.1]'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Regenerate Groups</span>
            </button>
          </div>

          <div className="font-mono text-xs opacity-60 font-semibold">
            5 groups × 5 characters = 25 letters
          </div>
        </div>

        {/* Live Audio Stream Cards */}
        <div className={`p-6 rounded-2xl mb-6 transition-all ${
          isBrutal
            ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
            : isDark
            ? 'bg-[#0d0d11] border border-white/[0.06]'
            : 'bg-neutral-50 border border-neutral-200'
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-60 mb-2 font-bold">
            Telegraphic Stream
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-2xl font-black tracking-widest select-none">
            {lessonGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  isBrutal
                    ? 'bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]'
                    : isDark
                    ? 'bg-white/[0.04] border border-white/[0.08]'
                    : 'bg-white border border-neutral-200'
                }`}
              >
                {group.split('').map((char, cIdx) => {
                  const globalIdx = gIdx * 6 + cIdx;
                  const isCurrent = globalIdx === currentCharIndex;
                  return (
                    <span
                      key={cIdx}
                      className={`inline-block transition-all px-0.5 ${
                        isCurrent
                          ? 'text-[#ff5500] scale-125 underline decoration-2'
                          : isFinished
                          ? 'opacity-70'
                          : 'opacity-90'
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

        {/* Transcription Input Field */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider font-bold opacity-70 mb-2">
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
              placeholder="Listen and type characters continuously..."
              className={`flex-1 px-5 py-3.5 font-mono text-xl font-bold tracking-widest rounded-2xl outline-none uppercase transition-all ${
                isBrutal
                  ? 'bg-white text-neutral-900 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] focus:border-[#ff5500] focus:shadow-[4px_4px_0px_0px_#ff5500]'
                  : isDark
                  ? 'bg-white/[0.04] text-white border border-white/[0.1] focus:border-blue-500 focus:bg-white/[0.06]'
                  : 'bg-white text-neutral-900 border border-neutral-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />
            <button
              onClick={handleEvaluate}
              className={`px-8 py-3.5 font-black text-sm rounded-2xl transition-all whitespace-nowrap ${
                isBrutal
                  ? 'bg-[#ffcc00] text-neutral-900 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px]'
                  : isDark
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white font-semibold shadow-sm'
              }`}
            >
              Verify Score
            </button>
          </div>
        </div>

        {/* Evaluation Result Card */}
        {scoreResult && (
          <div className={`mt-6 p-6 rounded-2xl transition-all ${
            scoreResult.passed
              ? isBrutal
                ? 'border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b]'
                : isDark
                ? 'border border-emerald-500/40 bg-emerald-950/20 text-white'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-950'
              : isBrutal
              ? 'border-2 border-neutral-900 bg-[#f5f4ee] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b]'
              : isDark
              ? 'border border-rose-500/40 bg-rose-950/20 text-white'
              : 'border border-rose-200 bg-rose-50 text-rose-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black ${
                  scoreResult.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {scoreResult.passed ? 'Lesson Mastered! (≥ 90%)' : 'Needs More Repetition'}
                  </h3>
                  <p className="text-xs opacity-75 font-mono">
                    Correct: {scoreResult.correctChars} / {scoreResult.totalChars} characters
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-mono uppercase opacity-60">Accuracy</span>
                  <div className="text-3xl font-black font-mono">
                    {scoreResult.accuracy}%
                  </div>
                </div>

                {scoreResult.passed && currentLevel < 40 && (
                  <button
                    onClick={handleNextLevel}
                    className={`flex items-center gap-2 px-5 py-3 font-black text-xs rounded-xl transition-all ${
                      isBrutal
                        ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                        : 'bg-emerald-500 text-neutral-950 font-bold shadow-md'
                    }`}
                  >
                    <span>Advance to Lesson {currentLevel + 1}</span>
                    <ArrowRight className="h-4 w-4" />
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
