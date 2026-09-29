import { useState, useEffect, useCallback } from 'react';
import type { PracticeMode, AudioSettings, UserStats } from './types/morse';
import { audioEngine } from './services/audioEngine';
import { StorageService } from './services/storageService';
import { Navigation } from './components/Navigation';
import { Oscilloscope } from './components/Oscilloscope';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { KochTrainer } from './components/KochTrainer';
import { CopyTrainer } from './components/CopyTrainer';
import { KeyerTrainer } from './components/KeyerTrainer';
import { AsocExamSimulator } from './components/AsocExamSimulator';
import { ReferenceSoundboard } from './components/ReferenceSoundboard';
import { StatsDashboard } from './components/StatsDashboard';
import { Radio } from 'lucide-react';

export function App() {
  const [currentMode, setCurrentMode] = useState<PracticeMode>('koch');
  const [settings, setSettings] = useState<AudioSettings>(() => StorageService.getSettings());
  const [stats, setStats] = useState<UserStats>(() => StorageService.getStats());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isKeyingActive, setIsKeyingActive] = useState<boolean>(false);
  const [showOscilloscope, setShowOscilloscope] = useState<boolean>(true);

  // Sync audio engine on load
  useEffect(() => {
    audioEngine.updateSettings(settings);
  }, [settings]);

  // Monitor playing status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlayingAudio(audioEngine.getIsPlaying());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleStatsUpdate = useCallback(() => {
    setStats(StorageService.getStats());
  }, []);

  const handleVolumeChange = (volume: number) => {
    const updated = { ...settings, volume };
    setSettings(updated);
    audioEngine.updateSettings({ volume });
    StorageService.saveSettings(updated);
  };

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Console Top Navigation Bar */}
      <Navigation
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onVolumeChange={handleVolumeChange}
        isPlaying={isPlayingAudio}
        isKeyingActive={isKeyingActive}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16 pt-4 px-2 sm:px-4">
        {/* Hardware Oscilloscope Strip */}
        <div className="mx-auto max-w-5xl px-4 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-300">REAL-TIME RF / AUDIO SPECTRUM</span>
              <span className="text-slate-600">//</span>
              <span className="text-slate-400">{settings.pitch} Hz Sine Carrier</span>
            </div>
            <button
              onClick={() => setShowOscilloscope(!showOscilloscope)}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono underline"
            >
              {showOscilloscope ? 'Collapse Scope' : 'Expand Scope'}
            </button>
          </div>

          {showOscilloscope && (
            <Oscilloscope
              color={isPlayingAudio ? 'amber' : isKeyingActive ? 'green' : 'cyan'}
              height={70}
            />
          )}
        </div>

        {/* View Switching */}
        {currentMode === 'koch' && (
          <KochTrainer settings={settings} onStatsUpdate={handleStatsUpdate} />
        )}

        {currentMode === 'copy' && (
          <CopyTrainer settings={settings} onStatsUpdate={handleStatsUpdate} />
        )}

        {currentMode === 'keyer' && (
          <KeyerTrainer
            settings={settings}
            onKeyingStateChange={setIsKeyingActive}
          />
        )}

        {currentMode === 'exam' && (
          <AsocExamSimulator settings={settings} onStatsUpdate={handleStatsUpdate} />
        )}

        {currentMode === 'reference' && (
          <ReferenceSoundboard settings={settings} />
        )}

        {currentMode === 'stats' && (
          <StatsDashboard stats={stats} onRefresh={handleStatsUpdate} />
        )}
      </main>

      {/* Bottom Status & Hardware Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090b12] py-3 px-4 text-xs font-mono text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            <span>DITDAH CW STATION</span>
            <span className="text-slate-600">•</span>
            <span>Target: 20 WPM</span>
            <span className="text-slate-600">•</span>
            <span>ASOC Syllabus Compliant</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Shortcuts: <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">Space</kbd> Key / <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">Ctrl+R</kbd> Repeat</span>
            <span>Web Audio 24-bit 48kHz</span>
          </div>
        </div>
      </footer>

      {/* Audio Calibration Modal */}
      <AudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
}

export default App;
