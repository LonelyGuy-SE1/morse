import { useState } from 'react';
import type { AudioSettings, ThemeMode } from '../types/morse';
import { audioEngine } from '../services/audioEngine';
import { StorageService } from '../services/storageService';
import { Volume2, Sliders, Radio, Zap, X, RotateCcw, Palette } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

export const AudioSettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: AudioSettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<AudioSettings>(settings);

  if (!isOpen) return null;

  const isBrutal = localSettings.theme === 'neo-brutal';
  const isDark = localSettings.theme === 'apple-dark';

  const handleChange = (key: keyof AudioSettings, value: number | boolean | ThemeMode) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    audioEngine.updateSettings(updated);
    StorageService.saveSettings(updated);
    onSettingsChange(updated);
  };

  const handleTestBeep = () => {
    audioEngine.initAudio().then(() => {
      audioEngine.testTone('dit');
      setTimeout(() => audioEngine.testTone('dah'), 150);
    });
  };

  const handleResetDefaults = () => {
    const defaults: AudioSettings = {
      pitch: 650,
      charWpm: 20,
      effectiveWpm: 8,
      volume: 0.8,
      hfNoiseEnabled: false,
      hfNoiseVolume: 0.12,
      attackDecayMs: 5,
      theme: 'neo-brutal',
    };
    setLocalSettings(defaults);
    audioEngine.updateSettings(defaults);
    StorageService.saveSettings(defaults);
    onSettingsChange(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className={`relative w-full max-w-lg p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white text-neutral-900 shadow-[8px_8px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.1] bg-[#141418] text-white shadow-2xl'
          : 'rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-inherit">
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
              isBrutal ? 'bg-[#ffcc00] border-2 border-neutral-900' : 'bg-blue-600/20 text-blue-400'
            }`}>
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Audio & Visual Calibrator</h2>
              <p className="text-xs opacity-60 font-mono">Web Audio Engine // Hardware Sidetone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Theme Selector */}
          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'
          }`}>
            <label className="text-xs font-mono font-bold uppercase opacity-70 flex items-center gap-2 mb-2">
              <Palette className="h-3.5 w-3.5 text-[#ff5500]" />
              Visual Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'neo-brutal', label: '⚡ Neo-Brutalist' },
                { id: 'apple-dark', label: ' Dark Studio' },
                { id: 'apple-light', label: '☀️ Clean Light' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => handleChange('theme', th.id as ThemeMode)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                    localSettings.theme === th.id
                      ? isBrutal
                        ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]'
                        : 'bg-white text-neutral-950 shadow-md font-semibold'
                      : isBrutal
                      ? 'bg-white border-2 border-neutral-900'
                      : 'bg-white/[0.05] border border-white/[0.08] opacity-70'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sidetone Pitch */}
          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold uppercase opacity-70 flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-[#ff5500]" />
                Sidetone Frequency (Pitch)
              </label>
              <span className="font-mono text-sm font-black text-[#ff5500]">
                {localSettings.pitch} Hz
              </span>
            </div>
            <input
              type="range"
              min="400"
              max="950"
              step="10"
              value={localSettings.pitch}
              onChange={(e) => handleChange('pitch', Number(e.target.value))}
              className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-[#ff5500]"
            />
            <div className="flex justify-between text-[10px] font-mono opacity-50 mt-1">
              <span>400 Hz (Bass)</span>
              <span>650 Hz (Standard CW)</span>
              <span>950 Hz (Treble)</span>
            </div>
          </div>

          {/* Speed Controls: Farnsworth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl ${
              isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono font-bold uppercase opacity-70">
                  Target Cadence
                </label>
                <span className="font-mono text-sm font-black text-[#ff5500]">
                  {localSettings.charWpm} WPM
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="35"
                step="1"
                value={localSettings.charWpm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleChange('charWpm', val);
                  if (localSettings.effectiveWpm > val) {
                    handleChange('effectiveWpm', val);
                  }
                }}
                className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-[#ff5500]"
              />
            </div>

            <div className={`p-4 rounded-2xl ${
              isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono font-bold uppercase opacity-70">
                  Spacing (Farnsworth)
                </label>
                <span className="font-mono text-sm font-black">
                  {localSettings.effectiveWpm} WPM
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={localSettings.charWpm}
                step="1"
                value={localSettings.effectiveWpm}
                onChange={(e) => handleChange('effectiveWpm', Number(e.target.value))}
                className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
          </div>

          {/* Atmospheric HF Static */}
          <div className={`p-4 rounded-2xl ${
            isBrutal ? 'bg-[#f5f4ee] border-2 border-neutral-900' : 'bg-white/[0.04]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-[#ff5500]" />
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase opacity-80">
                    HF Radio Atmospheric Static
                  </h4>
                  <p className="text-[11px] opacity-60">Realistic on-air receiver conditions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('hfNoiseEnabled', !localSettings.hfNoiseEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.hfNoiseEnabled ? 'bg-[#ff5500]' : 'bg-neutral-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.hfNoiseEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t pt-4 border-inherit">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTestBeep}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl ${
                isBrutal ? 'bg-[#ffcc00] border-2 border-neutral-900 shadow-[1px_1px_0px_0px_#18181b]' : 'bg-white/[0.08]'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Test Tone
            </button>
            <button
              onClick={onClose}
              className={`px-5 py-1.5 text-xs font-black rounded-xl ${
                isBrutal ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]' : 'bg-blue-600 text-white'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
