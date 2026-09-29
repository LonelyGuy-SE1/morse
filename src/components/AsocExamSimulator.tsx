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
  const [examStep, setExamStep] = useState<'setup' | 'running' | 'review' | 'result'>('setup');
  const [sectionType, setSectionType] = useState<'cipher' | 'plain'>('cipher');

  // Exam content
  const [cipherGroups, setCipherGroups] = useState<string[]>([]);
  const [plainMessage, setPlainMessage] = useState<string>('');
  const [userSubmission, setUserSubmission] = useState<string>('');

  // Timer & state
  const [timeLeftSec, setTimeLeftSec] = useState<number>(300); // 5 minutes
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<AsocExamResult | null>(null);

  const timerIntervalRef = useRef<number | null>(null);

  // Speed according to grade
  const targetWpm = examGrade === 'restricted' ? 8 : examGrade === 'general' ? 12 : 20;

  // Initialize Exam
  const startExam = async () => {
    // Generate 15 standard 5-character groups (75 characters) for practical mock duration
    const groups = generateRandomGroups(15);
    setCipherGroups(groups);

    const plain = ASOC_PLAIN_MESSAGES[Math.floor(Math.random() * ASOC_PLAIN_MESSAGES.length)];
    setPlainMessage(plain);

    setUserSubmission('');
    setExamStep('running');
    setTimeLeftSec(300); // 5 minutes standard test time

    // Start timer countdown
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

    // Audio stream text
    const textToPlay = sectionType === 'cipher' ? groups.join(' ') : plain;

    // Temporarily calibrate audio speed for exam standard
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

  // Grade user exam according to official WPC criteria
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
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Exam Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Government of India // WPC Wing
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  Official Standard
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                ASOC Examination Simulator
              </h2>
            </div>
          </div>

          {examStep === 'running' && (
            <div className="flex items-center gap-2 rounded-xl bg-[#171926] px-4 py-2 border border-slate-700 font-mono text-base font-bold text-amber-400">
              <Clock className="h-4 w-4 animate-spin text-amber-400" />
              <span>{formatTime(timeLeftSec)} REMAINING</span>
            </div>
          )}
        </div>

        {/* Grade Selection */}
        {examStep === 'setup' && (
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-mono uppercase text-slate-400">
              Select Examination Target Grade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'restricted',
                  title: 'Restricted Grade (ASOC-R)',
                  wpm: '8 WPM',
                  desc: 'Standard requirement for entry-level amateur station operator license.',
                },
                {
                  id: 'general',
                  title: 'General Grade (ASOC-G)',
                  wpm: '12 WPM',
                  desc: 'Standard requirement for unrestricted HF transceiver privileges.',
                },
                {
                  id: 'master',
                  title: 'Master Challenge',
                  wpm: '20 WPM',
                  desc: 'High-speed CW qualification for contest & DX operation.',
                },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setExamGrade(g.id as 'restricted' | 'general' | 'master')}
                  className={`flex flex-col text-left rounded-xl p-4 border transition-all ${
                    examGrade === g.id
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-[#161824] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{g.title}</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                      {g.wpm}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{g.desc}</p>
                </button>
              ))}
            </div>

            {/* Test Section Type */}
            <div className="pt-2">
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Exam Section
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSectionType('cipher')}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
                    sectionType === 'cipher'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-[#161824] text-slate-400'
                  }`}
                >
                  Section A: 5-Character Cipher Groups (Standard)
                </button>
                <button
                  onClick={() => setSectionType('plain')}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
                    sectionType === 'plain'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-800 bg-[#161824] text-slate-400'
                  }`}
                >
                  Section B: Plain Language Telegraphic Text
                </button>
              </div>
            </div>

            {/* Launch Exam Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={startExam}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Begin Official Mock Exam ({targetWpm} WPM)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Running Exam Station */}
      {examStep === 'running' && (
        <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isPlayingAudio ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-mono text-sm text-slate-300">
                {isPlayingAudio ? 'Audio Stream Transmitting...' : 'Transmission Finished — Complete Copy Check'}
              </span>
            </div>

            {isPlayingAudio && (
              <button
                onClick={stopExamAudio}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-600/30"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Abort Audio</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              Official Candidate Transcription Answer Sheet
            </label>
            <textarea
              rows={6}
              value={userSubmission}
              onChange={(e) => setUserSubmission(e.target.value.toUpperCase())}
              placeholder="Record received telegraph characters here in 5-letter blocks..."
              className="w-full rounded-xl border border-slate-700 bg-[#161824] p-4 font-mono text-lg tracking-widest text-amber-300 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none uppercase"
            />
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Note: Uncorrected errors, missing characters, or extra additions will be deducted per official WPC rules.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              onClick={() => {
                stopExamAudio();
                setExamStep('setup');
              }}
              className="rounded-xl border border-slate-700 bg-[#181a26] px-4 py-2.5 text-xs text-slate-300 hover:text-white"
            >
              Cancel Exam
            </button>

            <button
              onClick={handleGradeExam}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-95"
            >
              <FileCheck className="h-4 w-4" />
              <span>Submit & Official Evaluation</span>
            </button>
          </div>
        </div>
      )}

      {/* Official Certificate & Result */}
      {examStep === 'result' && examResult && (
        <div className="rounded-2xl border border-slate-700 bg-[#11131c] p-8 shadow-2xl space-y-6">
          <div className="text-center border-b border-slate-800 pb-6">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
              AMATEUR STATION OPERATOR'S CERTIFICATE (ASOC)
            </span>
            <h1 className="text-2xl font-black text-white mt-1">OFFICIAL EXAMINATION REPORT</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Certificate No: {examResult.id} • Date: {examResult.date}
            </p>
          </div>

          {/* Pass/Fail Status Banner */}
          <div className={`rounded-xl p-5 border text-center ${
            examResult.passed 
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400' 
              : 'border-rose-500/40 bg-rose-950/20 text-rose-400'
          }`}>
            <div className="flex justify-center mb-2">
              {examResult.passed ? (
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              ) : (
                <XCircle className="h-10 w-10 text-rose-400" />
              )}
            </div>
            <h3 className="text-xl font-black tracking-wider uppercase">
              {examResult.passed ? 'QUALIFIED / PASSED' : 'DID NOT QUALIFY'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {examResult.passed
                ? `Candidate meets the standard proficiency requirements for ASOC ${examResult.grade} at ${examResult.wpm} WPM.`
                : `Score below the required pass threshold. Recommended: Focus on Koch lessons and rhythmic copy.`}
            </p>
          </div>

          {/* Detailed Error Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
            <div className="rounded-xl border border-slate-800 bg-[#171926] p-4">
              <span className="text-xs text-slate-400">Final Accuracy</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {sectionType === 'cipher' ? examResult.cipherAccuracy : examResult.plainAccuracy}%
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#171926] p-4">
              <span className="text-xs text-slate-400">Substitutions</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {examResult.errors.substitutions}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#171926] p-4">
              <span className="text-xs text-slate-400">Omissions</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {examResult.errors.omissions}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#171926] p-4">
              <span className="text-xs text-slate-400">Additions</span>
              <div className="text-2xl font-bold text-slate-400 mt-1">
                {examResult.errors.additions}
              </div>
            </div>
          </div>

          {/* Original Reference vs Candidate Transcript */}
          <div className="rounded-xl border border-slate-800 bg-[#0b0d14] p-4 space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-500 uppercase">Original Reference:</span>
              <div className="mt-1 text-slate-300 break-all bg-[#141622] p-2.5 rounded border border-slate-800">
                {sectionType === 'cipher' ? cipherGroups.join(' ') : plainMessage}
              </div>
            </div>

            <div>
              <span className="text-slate-500 uppercase">Your Answer:</span>
              <div className="mt-1 text-amber-300 break-all bg-[#141622] p-2.5 rounded border border-slate-800">
                {userSubmission || '(No submission entered)'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#181a26] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <Printer className="h-4 w-4" />
              <span>Print Certificate</span>
            </button>

            <button
              onClick={() => {
                setExamStep('setup');
                setExamResult(null);
              }}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-xs text-slate-950 hover:bg-amber-400"
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
