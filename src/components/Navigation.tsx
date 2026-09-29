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
  const navItems: { id: PracticeMode; label: string; icon: typeof GraduationCap; badge?: string }[] = [
    { id: 'koch', label: 'Koch Academy', icon: GraduationCap, badge: '40' },
    { id: 'copy', label: 'Audio Copy (RX)', icon: Headphones },
    { id: 'keyer', label: 'Keyer (TX)', icon: Radio },
    { id: 'exam', label: 'Timed Mock Exam', icon: FileCheck, badge: 'Timed' },
    { id: 'reference', label: 'Dictionary', icon: BookOpen },
    { id: 'stats', label: 'Telemetry', icon: BarChart2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f5f4ee]/95 backdrop-blur-md border-b-2 border-neutral-900 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        {/* Brand & SE1 Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/se1.jpg"
            alt="SE1 Logo"
            className="h-10 w-10 rounded-xl object-cover border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-base text-neutral-900">
                MORSE ACADEMY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 font-bold bg-neutral-900 text-white rounded-md">
                20 WPM
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 font-mono">
              Precision Telegraphy & High-Speed CW Station
            </p>
          </div>
        </div>

        {/* Live Audio / Carrier State Indicators */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 font-mono text-xs font-semibold bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] rounded-xl text-neutral-900">
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full transition-all ${
              isPlaying
                ? 'bg-[#ff5500] scale-125 animate-pulse shadow-[0_0_8px_#ff5500]'
                : 'bg-neutral-300'
            }`} />
            <span className={isPlaying ? 'text-[#ff5500] font-bold' : 'opacity-60'}>RX AUDIO</span>
          </div>

          <span className="opacity-30">|</span>

          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full transition-all ${
              isKeyingActive
                ? 'bg-emerald-500 scale-125 shadow-[0_0_8px_#10b981]'
                : 'bg-neutral-300'
            }`} />
            <span className={isKeyingActive ? 'text-emerald-500 font-bold' : 'opacity-60'}>TX KEY</span>
          </div>

          <span className="opacity-30">|</span>

          <div className="font-mono">
            <span>{settings.charWpm}</span>
            <span className="opacity-50">/{settings.effectiveWpm} WPM</span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Volume Slider */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] rounded-xl">
            <Volume2 className="h-4 w-4 opacity-70" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
              className="h-1.5 w-16 appearance-none rounded-lg cursor-pointer bg-neutral-400 accent-neutral-900"
            />
          </div>

          {/* Audio Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all bg-white text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] rounded-xl hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>

      {/* Mode Segmented Navigation Pill Strip */}
      <div className="mx-auto mt-3 max-w-6xl overflow-x-auto pb-0.5">
        <nav className="flex p-1.5 gap-1.5 rounded-2xl bg-neutral-200/80 border-2 border-neutral-900">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-[2px_2px_0px_0px_#ff5500] scale-[1.02]'
                    : 'text-neutral-700 hover:bg-neutral-300/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md uppercase ${
                    isActive
                      ? 'bg-[#ff5500] text-neutral-900 font-bold'
                      : 'opacity-60 bg-neutral-300/50'
                  }`}>
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
