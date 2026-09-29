import type { FC } from 'react';
import type { PracticeMode, AudioSettings } from '../types/morse';
import { 
  GraduationCap, 
  Headphones, 
  Radio, 
  FileCheck, 
  BookOpen, 
  BarChart2, 
  SlidersHorizontal,
  Volume2
} from 'lucide-react';

interface NavigationProps {
  currentMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
  settings: AudioSettings;
  onOpenSettings: () => void;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  isKeyingActive: boolean;
}

export const Navigation: FC<NavigationProps> = ({
  currentMode,
  onSelectMode,
  settings,
  onOpenSettings,
  onVolumeChange,
  isPlaying,
  isKeyingActive,
}) => {
  const navItems: { id: PracticeMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'koch', label: 'Koch Academy', icon: <GraduationCap className="h-4 w-4" />, badge: '40 Levels' },
    { id: 'copy', label: 'Audio Copy (RX)', icon: <Headphones className="h-4 w-4" /> },
    { id: 'keyer', label: 'Sending Keyer (TX)', icon: <Radio className="h-4 w-4" /> },
    { id: 'exam', label: 'ASOC Mock Exam', icon: <FileCheck className="h-4 w-4" />, badge: 'WPC' },
    { id: 'reference', label: 'Morse Soundboard', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'stats', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0c0d13]/90 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Brand / Callsign Hardware Plate */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 text-slate-950 font-black text-lg tracking-wider">
            CW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-base">DITDAH</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                ASOC ACADEMY
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">High-Speed CW Telegraphy Tutor</p>
          </div>
        </div>

        {/* Tactile Hardware Status Indicators */}
        <div className="hidden md:flex items-center gap-4 rounded-lg bg-[#141620] px-3 py-1.5 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isPlaying ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'
              } transition-all duration-100`}
            />
            <span className={isPlaying ? 'text-amber-300 font-bold' : 'text-slate-500'}>RX AUDIO</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isKeyingActive ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'
              } transition-all duration-100`}
            />
            <span className={isKeyingActive ? 'text-emerald-300 font-bold' : 'text-slate-500'}>TX CARRIER</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <div className="text-slate-400">
            <span className="text-white font-bold">{settings.charWpm}</span>
            <span className="text-[10px] text-slate-500">/{settings.effectiveWpm} WPM</span>
          </div>
        </div>

        {/* Quick Audio Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-[#141620] px-3 py-1.5 border border-slate-800">
            <Volume2 className="h-4 w-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Master volume"
              className="h-1.5 w-20 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#161824] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-all shadow-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Calibrate Audio</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="mx-auto mt-3 max-w-7xl overflow-x-auto pb-1">
        <nav className="flex space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-400 hover:bg-[#161824] hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-0.5 rounded px-1.5 py-0.2 text-[10px] uppercase font-mono ${
                      isActive ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
