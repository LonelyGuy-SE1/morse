import { useState } from 'react';
import type { UserStats, ThemeMode } from '../types/morse';
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
  theme?: ThemeMode;
  onRefresh: () => void;
}

export const StatsDashboard = ({ stats, theme = 'neo-brutal', onRefresh }: StatsDashboardProps) => {
  const [importText, setImportText] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const isBrutal = theme === 'neo-brutal';
  const isDark = theme === 'apple-dark';

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

  const weakChars = Object.entries(stats.charAccuracyMap || {})
    .filter(([_, data]) => data.attempts >= 3 && (data.correct / data.attempts) < 0.8)
    .map(([char, data]) => ({
      char,
      accuracy: Math.round((data.correct / data.attempts) * 100),
      attempts: data.attempts,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Telemetry Header */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-5 border-inherit">
          <div>
            <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
              isBrutal ? 'text-[#ff5500]' : 'text-blue-500'
            }`}>
              Telemetry & Analytics
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">Performance Dashboard</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl transition-all ${
                isBrutal
                  ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] hover:bg-[#ffcc00]'
                  : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl transition-all ${
                isBrutal
                  ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] hover:bg-[#ffcc00]'
                  : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono font-bold">
            {message}
          </div>
        )}

        {showImport && (
          <div className="mb-6 p-4 rounded-2xl bg-[#f5f4ee] border-2 border-neutral-900 text-neutral-900 space-y-2">
            <label className="block text-xs font-mono font-bold uppercase">
              Paste Backup JSON Data
            </label>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON here..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-neutral-300 bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-3 py-1.5 text-xs opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 font-bold text-xs rounded-xl bg-neutral-900 text-white"
              >
                Apply Backup
              </button>
            </div>
          </div>
        )}

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-white/[0.03] border border-white/[0.06]'
          }`}>
            <div className="flex items-center gap-2 text-xs opacity-70 font-bold">
              <Clock className="h-4 w-4 text-[#ff5500]" />
              <span>Practice Time</span>
            </div>
            <div className="font-mono text-2xl font-black mt-1">
              {formatDuration(stats.totalPracticeTimeSec)}
            </div>
          </div>

          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-white/[0.03] border border-white/[0.06]'
          }`}>
            <div className="flex items-center gap-2 text-xs opacity-70 font-bold">
              <Flame className="h-4 w-4 text-[#ffcc00]" />
              <span>Drill Sessions</span>
            </div>
            <div className="font-mono text-2xl font-black mt-1 text-[#ff5500]">
              {stats.sessionsCompleted}
            </div>
          </div>

          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-white/[0.03] border border-white/[0.06]'
          }`}>
            <div className="flex items-center gap-2 text-xs opacity-70 font-bold">
              <Headphones className="h-4 w-4 text-emerald-500" />
              <span>Characters Copied</span>
            </div>
            <div className="font-mono text-2xl font-black mt-1">
              {stats.charactersHeard}
            </div>
          </div>

          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-white/[0.03] border border-white/[0.06]'
          }`}>
            <div className="flex items-center gap-2 text-xs opacity-70 font-bold">
              <Award className="h-4 w-4 text-purple-500" />
              <span>Koch Mastery</span>
            </div>
            <div className="font-mono text-2xl font-black mt-1">
              {stats.kochLevelUnlocked} / 40
            </div>
          </div>
        </div>
      </div>

      {/* Weak Characters Heatmap */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <h3 className="text-base font-black flex items-center gap-2 border-b pb-3 mb-4 border-inherit">
          <AlertCircle className="h-4 w-4 text-[#ff5500]" />
          <span>Cadence Weak Spots (Characters Needing Extra Practice)</span>
        </h3>

        {weakChars.length === 0 ? (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${
            isBrutal ? 'bg-[#ffcc00] border-2 border-neutral-900 text-neutral-900 font-bold' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-xs">
              Excellent rhythm! No severe weak characters detected. Maintain regular daily training!
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {weakChars.map((item) => (
              <div
                key={item.char}
                className={`p-3 rounded-2xl text-center ${
                  isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b]' : 'bg-rose-950/20 border border-rose-500/20'
                }`}
              >
                <div className="font-mono text-2xl font-black text-rose-500">{item.char}</div>
                <div className="font-mono text-xs font-bold mt-1">{item.accuracy}% Acc</div>
                <div className="text-[10px] opacity-60">{item.attempts} trials</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training History */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <h3 className="text-base font-black border-b pb-3 mb-4 border-inherit">
          Recent Training Log
        </h3>

        {stats.accuracyHistory.length === 0 ? (
          <div className="py-8 text-center text-xs opacity-50 font-mono">
            No training sessions logged yet. Complete a lesson to see telemetry!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-inherit opacity-60 uppercase">
                  <th className="py-2.5">Date / Time</th>
                  <th className="py-2.5">Training Mode</th>
                  <th className="py-2.5">Cadence</th>
                  <th className="py-2.5 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {stats.accuracyHistory.slice(-8).reverse().map((h, i) => (
                  <tr key={i} className="hover:bg-neutral-500/5">
                    <td className="py-2.5 opacity-60">
                      {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-bold">{h.mode}</td>
                    <td className="py-2.5 text-[#ff5500] font-bold">{h.wpm} WPM</td>
                    <td className="py-2.5 text-right font-black">
                      <span className={h.accuracy >= 90 ? 'text-emerald-500' : 'text-amber-500'}>
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
