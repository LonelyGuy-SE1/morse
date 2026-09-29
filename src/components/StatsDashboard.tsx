import { useState } from 'react';
import type { UserStats } from '../types/morse';
import { StorageService } from '../services/storageService';
import { 
  Clock, 
  Headphones, 
  Award, 
  Download, 
  Upload, 
  RotateCcw, 
  Flame, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface StatsDashboardProps {
  stats: UserStats;
  onRefresh: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, onRefresh }) => {
  const [importText, setImportText] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const formatDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} mins`;
  };

  const handleExport = () => {
    const jsonStr = StorageService.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ditdah-cw-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const ok = StorageService.importData(importText);
    if (ok) {
      setMessage('Progress imported successfully!');
      setShowImport(false);
      setImportText('');
      onRefresh();
    } else {
      setMessage('Invalid JSON data format. Please verify.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all practice logs and Koch levels?')) {
      StorageService.resetProgress();
      onRefresh();
    }
  };

  // Identify weak characters (accuracy < 80% with at least 3 attempts)
  const weakChars = Object.entries(stats.charAccuracyMap || {})
    .filter(([_, data]) => data.attempts >= 3 && (data.correct / data.attempts) < 0.8)
    .map(([char, data]) => ({
      char,
      accuracy: Math.round((data.correct / data.attempts) * 100),
      attempts: data.attempts,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Telemetry & Performance
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Training Analytics</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#181a26] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#181a26] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-900/30 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Message notification */}
        {message && (
          <div className="mt-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2 text-xs font-mono text-emerald-300">
            {message}
          </div>
        )}

        {/* Import Drawer */}
        {showImport && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Paste Backup JSON Data
            </label>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='Paste exported JSON string here...'
              className="w-full rounded-xl border border-slate-700 bg-[#161824] p-3 font-mono text-xs text-white focus:outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Apply Backup
              </button>
            </div>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#161824] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Practice Time</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white mt-1">
              {formatDuration(stats.totalPracticeTimeSec)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#161824] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Sessions</span>
            </div>
            <div className="font-mono text-2xl font-bold text-amber-400 mt-1">
              {stats.sessionsCompleted}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#161824] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Headphones className="h-4 w-4 text-emerald-400" />
              <span>Characters Copied</span>
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
              {stats.charactersHeard}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#161824] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Award className="h-4 w-4 text-purple-400" />
              <span>Koch Mastery</span>
            </div>
            <div className="font-mono text-2xl font-bold text-purple-400 mt-1">
              {stats.kochLevelUnlocked} / 40
            </div>
          </div>
        </div>
      </div>

      {/* Weak Characters Analysis */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <span>Cadence Weak Spots (Characters Needing Focused Attention)</span>
        </h3>

        {weakChars.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>Excellent rhythm! No severe weak characters detected. Keep up consistent daily drills!</span>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {weakChars.map((item) => (
              <div
                key={item.char}
                className="rounded-xl border border-rose-500/30 bg-[#1a1722] p-3 text-center"
              >
                <div className="font-mono text-2xl font-black text-rose-400">{item.char}</div>
                <div className="font-mono text-xs font-bold text-slate-300 mt-1">
                  {item.accuracy}% Acc
                </div>
                <div className="text-[10px] text-slate-500">{item.attempts} trials</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Session History */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Recent Training Log
        </h3>

        {stats.accuracyHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No training sessions logged yet. Complete a Koch lesson or Copy practice to see telemetry!
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase">
                  <th className="py-2.5">Date / Time</th>
                  <th className="py-2.5">Training Mode</th>
                  <th className="py-2.5">Speed (WPM)</th>
                  <th className="py-2.5 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.accuracyHistory.slice(-8).reverse().map((h, i) => (
                  <tr key={i} className="hover:bg-[#161824]">
                    <td className="py-2.5 text-slate-400">
                      {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 text-slate-200 font-semibold">{h.mode}</td>
                    <td className="py-2.5 text-amber-400">{h.wpm} WPM</td>
                    <td className="py-2.5 text-right font-bold">
                      <span className={h.accuracy >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                        {h.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
