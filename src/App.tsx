import { useState, useEffect, useCallback } from 'react';
import type { PracticeMode, AudioSettings, UserStats, ThemeMode } from './types/morse';
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

  // Sync theme to body class
  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
  }, [settings.theme]);

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

  const handleThemeChange = (theme: ThemeMode) => {
    const updated = { ...settings, theme };
    setSettings(updated);
    audioEngine.updateSettings({ theme });
    StorageService.saveSettings(updated);
  };

  const isBrutal = settings.theme === 'neo-brutal';
  const isDark = settings.theme === 'apple-dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isBrutal
        ? 'bg-[#f5f4ee] text-neutral-900 selection:bg-[#ff5500] selection:text-white'
        : isDark
        ? 'bg-[#09090b] text-slate-100 selection:bg-blue-600 selection:text-white'
        : 'bg-[#f8fafc] text-neutral-900 selection:bg-blue-600 selection:text-white'
    }`}>
      {/* Console Top Navigation Bar */}
      <Navigation
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onVolumeChange={handleVolumeChange}
        onThemeChange={handleThemeChange}
        isPlaying={isPlayingAudio}
        isKeyingActive={isKeyingActive}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16 pt-5 px-3 sm:px-6">
        {/* Hardware Oscilloscope Strip */}
        <div className="mx-auto max-w-5xl mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono opacity-60 mb-2 font-bold">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${
                isBrutal ? 'bg-[#ff5500]' : 'bg-emerald-500'
              }`} />
              <span>CARRIER MONITOR</span>
              <span>//</span>
              <span>{settings.pitch} Hz Sine Oscillator</span>
            </div>
            <button
              onClick={() => setShowOscilloscope(!showOscilloscope)}
              className="hover:opacity-100 underline"
            >
              {showOscilloscope ? 'Collapse Monitor' : 'Expand Monitor'}
            </button>
          </div>

          {showOscilloscope && (
            <Oscilloscope
              theme={settings.theme}
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
          <StatsDashboard stats={stats} theme={settings.theme} onRefresh={handleStatsUpdate} />
        )}
      </main>

      {/* Bottom Status & Hardware Footer */}
      <footer className={`border-t py-4 px-4 text-xs font-mono transition-colors ${
        isBrutal
          ? 'bg-white border-neutral-900 text-neutral-900 border-t-2'
          : isDark
          ? 'bg-[#09090b] border-white/[0.08] text-neutral-400'
          : 'bg-white border-neutral-200 text-neutral-600'
      }`}>
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold">
            <Radio className={`h-4 w-4 ${isBrutal ? 'text-[#ff5500]' : 'text-blue-500'}`} />
            <span>DITDAH CW ACADEMY</span>
            <span className="opacity-30">•</span>
            <span>ASOC 20 WPM</span>
            <span className="opacity-30">•</span>
            <span>WPC Indian Syllabus Compliant</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] opacity-70">
            <span>
              Controls: <kbd className="px-1.5 py-0.5 rounded border border-inherit font-bold">Space</kbd> Key / <kbd className="px-1.5 py-0.5 rounded border border-inherit font-bold">Ctrl+R</kbd> Repeat
            </span>
            <span>24-bit 48kHz Web Audio</span>
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
