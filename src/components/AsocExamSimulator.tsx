import { useState, useEffect, useRef } from 'react';
import { 
  generateRandomGroups, 
  ASOC_PLAIN_MESSAGES 
} from '../utils/morseData';
import { audioEngine } from '../services/audioEngine';
import { StorageService } from '../services/storageService';
import type { AudioSettings, AsocExamResult } from '../types/morse';
import { 
  FileCheck, 
  Play, 
  Square, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AsocExamSimulatorProps {
  settings: AudioSettings;
  onStatsUpdate: () => void;
}

export const AsocExamSimulator = ({
  settings,
  onStatsUpdate,
}: AsocExamSimulatorProps) => {
  const [examGrade, setExamGrade] = useState<'restricted' | 'general' | 'master'>('restricted');
  const [examStep, setExamStep] = useState<'setup' | 'running' | 'result'>('setup');
  const [sectionType, setSectionType] = useState<'cipher' | 'plain'>('cipher');

  const [cipherGroups, setCipherGroups] = useState<string[]>([]);
  const [plainMessage, setPlainMessage] = useState<string>('');
  const [userSubmission, setUserSubmission] = useState<string>('');

  const [timeLeftSec, setTimeLeftSec] = useState<number>(300);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<AsocExamResult | null>(null);

  const timerIntervalRef = useRef<number | null>(null);

  const isBrutal = settings.theme === 'neo-brutal';
  const isDark = settings.theme === 'apple-dark';

  const targetWpm = examGrade === 'restricted' ? 8 : examGrade === 'general' ? 12 : 20;

  const startExam = async () => {
    const groups = generateRandomGroups(15);
    setCipherGroups(groups);

    const plain = ASOC_PLAIN_MESSAGES[Math.floor(Math.random() * ASOC_PLAIN_MESSAGES.length)];
    setPlainMessage(plain);

    setUserSubmission('');
    setExamStep('running');
    setTimeLeftSec(300);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const textToPlay = sectionType === 'cipher' ? groups.join(' ') : plain;

    audioEngine.updateSettings({
      charWpm: Math.max(targetWpm, 16),
      effectiveWpm: targetWpm,
    });

    setIsPlayingAudio(true);
    await audioEngine.playSequence(
      textToPlay,
      undefined,
      () => {
        setIsPlayingAudio(false);
      }
    );
  };

  const stopExamAudio = () => {
    audioEngine.stopSequence();
    setIsPlayingAudio(false);
  };

  const handleGradeExam = () => {
    stopExamAudio();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const referenceText = (sectionType === 'cipher' ? cipherGroups.join(' ') : plainMessage)
      .toUpperCase()
      .replace(/\s+/g, '');
    const candidateText = userSubmission.toUpperCase().replace(/\s+/g, '');

    let omissions = 0;
    let substitutions = 0;
    let additions = 0;
    let correct = 0;

    const minLen = Math.min(referenceText.length, candidateText.length);

    for (let i = 0; i < minLen; i++) {
      if (candidateText[i] === referenceText[i]) {
        correct++;
      } else {
        substitutions++;
      }
    }

    if (candidateText.length < referenceText.length) {
      omissions = referenceText.length - candidateText.length;
    } else if (candidateText.length > referenceText.length) {
      additions = candidateText.length - referenceText.length;
    }

    const accuracy = Math.max(
      0,
      Math.round(((correct - (substitutions * 0.5 + omissions + additions)) / referenceText.length) * 100)
    );

    const passThreshold = examGrade === 'restricted' ? 50 : 60;
    const passed = accuracy >= passThreshold;

    const result: AsocExamResult = {
      id: `ASOC-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString(),
      grade: examGrade.toUpperCase(),
      wpm: targetWpm,
      cipherAccuracy: sectionType === 'cipher' ? accuracy : 0,
      plainAccuracy: sectionType === 'plain' ? accuracy : 0,
      passed,
      errors: {
        omissions,
        substitutions,
        additions,
      },
      details: `Official ASOC ${sectionType.toUpperCase()} test evaluated at ${targetWpm} WPM.`,
    };

    setExamResult(result);
    setExamStep('result');
    StorageService.recordExamResult(result);
    onStatsUpdate();

    if (passed) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      audioEngine.stopSequence();
      audioEngine.updateSettings(settings);
    };
  }, [settings]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Exam Header */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 border-inherit">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
              isBrutal ? 'bg-[#ff5500] text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-blue-600 text-white'
            }`}>
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
                  isBrutal ? 'text-[#ff5500]' : 'text-blue-500'
                }`}>
                  Ministry of Communications // WPC Wing
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 font-bold rounded-md ${
                  isBrutal ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-800'
                }`}>
                  Official Standard
                </span>
              </div>
              <h2 className="text-xl font-black mt-0.5 tracking-tight">ASOC Examination Simulator</h2>
            </div>
          </div>

          {examStep === 'running' && (
            <div className={`flex items-center gap-2 px-4 py-2 font-mono text-sm font-black rounded-xl ${
              isBrutal ? 'bg-[#ffcc00] border-2 border-neutral-900 text-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-blue-600 text-white'
            }`}>
              <Clock className="h-4 w-4 animate-spin" />
              <span>{formatTime(timeLeftSec)} REMAINING</span>
            </div>
          )}
        </div>

        {/* Grade Selection */}
        {examStep === 'setup' && (
          <div className="space-y-5">
            <label className="block text-xs font-mono uppercase font-bold opacity-70">
              Select Examination Target Grade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'restricted',
                  title: 'Restricted Grade (ASOC-R)',
                  wpm: '8 WPM',
                  desc: 'Standard requirement for entry-level operator license.',
                },
                {
                  id: 'general',
                  title: 'General Grade (ASOC-G)',
                  wpm: '12 WPM',
                  desc: 'Full HF transmission privileges with higher bandwidth.',
                },
                {
                  id: 'master',
                  title: 'Master Challenge',
                  wpm: '20 WPM',
                  desc: 'High-speed CW qualification for contest & DX mastery.',
                },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setExamGrade(g.id as 'restricted' | 'general' | 'master')}
                  className={`flex flex-col text-left p-5 rounded-2xl transition-all ${
                    examGrade === g.id
                      ? isBrutal
                        ? 'border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b] scale-[1.02]'
                        : 'border-2 border-blue-500 bg-blue-500/10 shadow-lg'
                      : isBrutal
                      ? 'border-2 border-neutral-900 bg-[#f5f4ee] hover:bg-neutral-200'
                      : 'border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-sm">{g.title}</span>
                    <span className={`px-2 py-0.5 font-mono text-xs font-bold rounded-md ${
                      isBrutal ? 'bg-neutral-900 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {g.wpm}
                    </span>
                  </div>
                  <p className="mt-2 text-xs opacity-75 font-medium">{g.desc}</p>
                </button>
              ))}
            </div>

            {/* Test Section Type */}
            <div className="pt-2">
              <label className="block text-xs font-mono uppercase font-bold opacity-70 mb-2">
                Exam Section
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSectionType('cipher')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    sectionType === 'cipher'
                      ? isBrutal
                        ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]'
                        : 'bg-white text-neutral-950 font-semibold shadow'
                      : isBrutal
                      ? 'bg-[#f5f4ee] border-2 border-neutral-900'
                      : 'bg-white/[0.05] border border-white/[0.1]'
                  }`}
                >
                  Section A: 5-Character Cipher Groups (Standard)
                </button>
                <button
                  onClick={() => setSectionType('plain')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    sectionType === 'plain'
                      ? isBrutal
                        ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]'
                        : 'bg-white text-neutral-950 font-semibold shadow'
                      : isBrutal
                      ? 'bg-[#f5f4ee] border-2 border-neutral-900'
                      : 'bg-white/[0.05] border border-white/[0.1]'
                  }`}
                >
                  Section B: Plain Language Telegraphic Text
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-inherit flex justify-end">
              <button
                onClick={startExam}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${
                  isBrutal
                    ? 'bg-[#ff5500] text-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px]'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                }`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Begin Official Mock Exam ({targetWpm} WPM)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Running Exam Screen */}
      {examStep === 'running' && (
        <div className={`p-8 space-y-6 transition-all ${
          isBrutal
            ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[6px_6px_0px_0px_#18181b]'
            : isDark
            ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-2xl'
            : 'rounded-3xl border border-neutral-200 bg-white shadow-md'
        }`}>
          <div className="flex items-center justify-between border-b pb-4 border-inherit">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isPlayingAudio ? 'bg-[#ff5500] animate-pulse' : 'bg-neutral-500'}`} />
              <span className="font-mono text-sm font-bold">
                {isPlayingAudio ? 'Audio Stream Transmitting...' : 'Transmission Complete — Verify Answers'}
              </span>
            </div>

            {isPlayingAudio && (
              <button
                onClick={stopExamAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-500 text-white"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Abort Audio</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider font-bold opacity-70 mb-2">
              Official Candidate Transcription Sheet
            </label>
            <textarea
              rows={6}
              value={userSubmission}
              onChange={(e) => setUserSubmission(e.target.value.toUpperCase())}
              placeholder="Record received telegraph characters here in 5-letter blocks..."
              className={`w-full p-4 font-mono text-lg font-bold tracking-widest rounded-2xl outline-none uppercase ${
                isBrutal
                  ? 'bg-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] focus:border-[#ff5500]'
                  : isDark
                  ? 'bg-white/[0.04] border border-white/[0.1] text-white focus:border-blue-500'
                  : 'bg-white border border-neutral-300'
              }`}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4 border-inherit">
            <button
              onClick={() => {
                stopExamAudio();
                setExamStep('setup');
              }}
              className={`px-4 py-2.5 font-bold text-xs rounded-xl ${
                isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              Cancel Exam
            </button>

            <button
              onClick={handleGradeExam}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl ${
                isBrutal
                  ? 'bg-[#ffcc00] text-neutral-900 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Submit & Official Evaluation</span>
            </button>
          </div>
        </div>
      )}

      {/* Official Certificate & Result */}
      {examStep === 'result' && examResult && (
        <div className={`p-8 space-y-6 transition-all ${
          isBrutal
            ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[8px_8px_0px_0px_#18181b]'
            : isDark
            ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-2xl'
            : 'rounded-3xl border border-neutral-200 bg-white shadow-md'
        }`}>
          <div className="text-center border-b pb-6 border-inherit">
            <span className="font-mono text-xs uppercase tracking-widest font-black text-[#ff5500]">
              GOVERNMENT OF INDIA // WPC WING
            </span>
            <h1 className="text-2xl font-black mt-1 tracking-tight">AMATEUR STATION OPERATOR'S CERTIFICATE</h1>
            <p className="text-xs font-mono opacity-70 mt-1">
              Certificate No: {examResult.id} • Date: {examResult.date}
            </p>
          </div>

          {/* Pass Banner */}
          <div className={`p-6 rounded-2xl text-center border-2 ${
            examResult.passed
              ? isBrutal
                ? 'border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b]'
                : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
              : isBrutal
              ? 'border-neutral-900 bg-rose-200 text-neutral-900 shadow-[4px_4px_0px_0px_#18181b]'
              : 'border-rose-500/40 bg-rose-950/20 text-rose-400'
          }`}>
            <div className="flex justify-center mb-2">
              {examResult.passed ? <CheckCircle className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider">
              {examResult.passed ? 'QUALIFIED / CERTIFIED' : 'DID NOT QUALIFY'}
            </h3>
            <p className="text-xs mt-1 font-medium max-w-lg mx-auto">
              {examResult.passed
                ? `Candidate meets the standard proficiency requirements for ASOC ${examResult.grade} at ${examResult.wpm} WPM.`
                : 'Score below pass threshold. Keep practicing Koch method lessons!'}
            </p>
          </div>

          {/* Breakdown Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
            <div className={`p-4 rounded-xl ${isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'}`}>
              <span className="text-xs opacity-60">Final Accuracy</span>
              <div className="text-2xl font-black mt-1 text-[#ff5500]">
                {sectionType === 'cipher' ? examResult.cipherAccuracy : examResult.plainAccuracy}%
              </div>
            </div>

            <div className={`p-4 rounded-xl ${isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'}`}>
              <span className="text-xs opacity-60">Substitutions</span>
              <div className="text-2xl font-black mt-1 text-rose-500">{examResult.errors.substitutions}</div>
            </div>

            <div className={`p-4 rounded-xl ${isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'}`}>
              <span className="text-xs opacity-60">Omissions</span>
              <div className="text-2xl font-black mt-1 text-amber-500">{examResult.errors.omissions}</div>
            </div>

            <div className={`p-4 rounded-xl ${isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'}`}>
              <span className="text-xs opacity-60">Additions</span>
              <div className="text-2xl font-black mt-1">{examResult.errors.additions}</div>
            </div>
          </div>

          {/* Comparison */}
          <div className={`p-4 rounded-2xl space-y-3 font-mono text-xs ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-[#0d0d11]'
          }`}>
            <div>
              <span className="opacity-60 uppercase font-bold">Original Reference:</span>
              <div className="mt-1 p-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 break-all font-bold">
                {sectionType === 'cipher' ? cipherGroups.join(' ') : plainMessage}
              </div>
            </div>

            <div>
              <span className="opacity-60 uppercase font-bold">Candidate Transcription:</span>
              <div className="mt-1 p-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 break-all font-bold">
                {userSubmission || '(No submission recorded)'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4 border-inherit">
            <button
              onClick={() => window.print()}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl ${
                isBrutal ? 'bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-white/[0.08]'
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>Print Official Certificate</span>
            </button>

            <button
              onClick={() => {
                setExamStep('setup');
                setExamResult(null);
              }}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs rounded-xl ${
                isBrutal ? 'bg-[#ffcc00] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-blue-600 text-white'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Take Another Mock Exam</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
