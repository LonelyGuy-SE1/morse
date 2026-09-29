import type { FC } from 'react';
import type { PracticeMode, AudioSettings, ThemeMode } from '../types/morse';
import { 
  GraduationCap, 
  Headphones, 
  Radio, 
  FileCheck, 
  BookOpen, 
  BarChart2, 
  SlidersHorizontal,
  Volume2,
  Moon,
  Sun,
  Zap
} from 'lucide-react';

interface NavigationProps {
  currentMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
  settings: AudioSettings;
  onOpenSettings: () => void;
  onVolumeChange: (volume: number) => void;
  onThemeChange: (theme: ThemeMode) => void;
  isPlaying: boolean;
  isKeyingActive: boolean;
}

export const Navigation: FC<NavigationProps> = ({
  currentMode,
  onSelectMode,
  settings,
  onOpenSettings,
  onVolumeChange,
  onThemeChange,
  isPlaying,
  isKeyingActive,
}) => {
  const isBrutal = settings.theme === 'neo-brutal';
  const isDark = settings.theme === 'apple-dark';

  const navItems: { id: PracticeMode; label: string; icon: typeof GraduationCap; badge?: string }[] = [
    { id: 'koch', label: 'Koch Academy', icon: GraduationCap, badge: '40' },
    { id: 'copy', label: 'Audio Copy (RX)', icon: Headphones },
    { id: 'keyer', label: 'Keyer (TX)', icon: Radio },
    { id: 'exam', label: 'ASOC Mock Exam', icon: FileCheck, badge: 'WPC' },
    { id: 'reference', label: 'Dictionary', icon: BookOpen },
    { id: 'stats', label: 'Telemetry', icon: BarChart2 },
  ];

  const cycleTheme = () => {
    if (settings.theme === 'neo-brutal') onThemeChange('apple-dark');
    else if (settings.theme === 'apple-dark') onThemeChange('apple-light');
    else onThemeChange('neo-brutal');
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors ${
      isBrutal
        ? 'bg-[#f5f4ee]/90 backdrop-blur-md border-b-2 border-neutral-900'
        : isDark
        ? 'bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.08]'
        : 'bg-white/80 backdrop-blur-xl border-b border-neutral-200'
    } px-4 py-3`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        {/* Brand & Callout */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center font-black text-sm tracking-wider ${
            isBrutal
              ? 'bg-[#ff5500] text-neutral-900 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#18181b] rounded-xl'
              : isDark
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20'
              : 'bg-neutral-900 text-white rounded-xl shadow-md'
          }`}>
            CW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-black tracking-tight text-base ${
                isBrutal ? 'text-neutral-900' : isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                DITDAH
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 font-bold ${
                isBrutal
                  ? 'bg-neutral-900 text-white rounded-md'
                  : isDark
                  ? 'bg-white/[0.08] text-neutral-300 border border-white/[0.1] rounded-md'
                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md'
              }`}>
                ASOC 20 WPM
              </span>
            </div>
            <p className={`text-[11px] ${
              isBrutal ? 'text-neutral-600 font-mono' : isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Precision CW Academy & Exam Station
            </p>
          </div>
        </div>

        {/* Live Audio / Carrier State Indicators */}
        <div className={`hidden md:flex items-center gap-3 px-3 py-1.5 font-mono text-xs font-semibold ${
          isBrutal
            ? 'bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] rounded-xl'
            : isDark
            ? 'bg-white/[0.04] border border-white/[0.08] rounded-xl text-neutral-300'
            : 'bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full transition-all ${
              isPlaying
                ? 'bg-[#ff5500] scale-125 animate-pulse shadow-[0_0_8px_#ff5500]'
                : isDark ? 'bg-neutral-700' : 'bg-neutral-300'
            }`} />
            <span className={isPlaying ? 'text-[#ff5500] font-bold' : 'opacity-60'}>RX AUDIO</span>
          </div>

          <span className="opacity-30">|</span>

          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full transition-all ${
              isKeyingActive
                ? 'bg-emerald-500 scale-125 shadow-[0_0_8px_#10b981]'
                : isDark ? 'bg-neutral-700' : 'bg-neutral-300'
            }`} />
            <span className={isKeyingActive ? 'text-emerald-500 font-bold' : 'opacity-60'}>TX KEY</span>
          </div>

          <span className="opacity-30">|</span>

          <div className="font-mono">
            <span>{settings.charWpm}</span>
            <span className="opacity-50">/{settings.effectiveWpm} WPM</span>
          </div>
        </div>

        {/* Global Controls & Theme Switcher */}
        <div className="flex items-center gap-2">
          {/* Volume Slider */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 ${
            isBrutal
              ? 'bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] rounded-xl'
              : isDark
              ? 'bg-white/[0.04] border border-white/[0.08] rounded-xl'
              : 'bg-neutral-100 border border-neutral-200 rounded-xl'
          }`}>
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

          {/* Theme Selector Button */}
          <button
            onClick={cycleTheme}
            title="Toggle theme: Neo-Brutalist, Apple Dark, Apple Light"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${
              isBrutal
                ? 'bg-[#ffcc00] text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-xl active:translate-x-[1px] active:translate-y-[1px]'
                : isDark
                ? 'bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.1] rounded-xl'
                : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300 rounded-xl'
            }`}
          >
            {settings.theme === 'neo-brutal' ? (
              <>
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span className="hidden sm:inline">Neo-Brutal</span>
              </>
            ) : settings.theme === 'apple-dark' ? (
              <>
                <Moon className="h-3.5 w-3.5 fill-current" />
                <span className="hidden sm:inline">Apple Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Apple Light</span>
              </>
            )}
          </button>

          {/* Audio Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${
              isBrutal
                ? 'bg-white text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] rounded-xl hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]'
                : isDark
                ? 'bg-white/[0.06] text-neutral-200 hover:bg-white/[0.1] border border-white/[0.1] rounded-xl'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300 rounded-xl'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>

      {/* Mode Segmented Navigation Pill Strip */}
      <div className="mx-auto mt-3 max-w-6xl overflow-x-auto pb-0.5">
        <nav className={`flex p-1 gap-1.5 rounded-2xl ${
          isBrutal
            ? 'bg-neutral-200/80 border-2 border-neutral-900 p-1.5'
            : isDark
            ? 'bg-white/[0.03] border border-white/[0.06]'
            : 'bg-neutral-100/90 border border-neutral-200'
        }`}>
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? isBrutal
                      ? 'bg-neutral-900 text-white shadow-[2px_2px_0px_0px_#ff5500] scale-[1.02]'
                      : isDark
                      ? 'bg-white text-neutral-950 shadow-md font-semibold'
                      : 'bg-white text-neutral-900 shadow-sm border border-neutral-200 font-semibold'
                    : isBrutal
                    ? 'text-neutral-700 hover:bg-neutral-300/60'
                    : isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md uppercase ${
                    isActive
                      ? isBrutal ? 'bg-[#ff5500] text-neutral-900 font-bold' : 'bg-neutral-200 text-neutral-800'
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
