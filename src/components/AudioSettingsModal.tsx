import { useState } from 'react';
import type { AudioSettings } from '../types/morse';
import { audioEngine } from '../services/audioEngine';
import { StorageService } from '../services/storageService';
import { Volume2, Sliders, Radio, Zap, X, RotateCcw } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState<AudioSettings>(settings);

  if (!isOpen) return null;

  const handleChange = (key: keyof AudioSettings, value: number | boolean) => {
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
    };
    setLocalSettings(defaults);
    audioEngine.updateSettings(defaults);
    StorageService.saveSettings(defaults);
    onSettingsChange(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#12141c] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Audio & CW Signal Calibrator</h2>
              <p className="text-xs text-slate-400 font-mono">Web Audio Engine // Hardware Sidetone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Controls */}
        <div className="mt-5 space-y-5">
          {/* Pitch Control */}
          <div className="rounded-xl border border-slate-800 bg-[#171924] p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-emerald-400" />
                Sidetone Frequency (Pitch)
              </label>
              <span className="font-mono text-sm font-bold text-emerald-400">{localSettings.pitch} Hz</span>
            </div>
            <input
              type="range"
              min="400"
              max="950"
              step="10"
              value={localSettings.pitch}
              onChange={(e) => handleChange('pitch', Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
              <span>400 Hz (Bass)</span>
              <span>650 Hz (Standard CW)</span>
              <span>950 Hz (Treble)</span>
            </div>
          </div>

          {/* Speed Controls: Farnsworth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Character WPM */}
            <div className="rounded-xl border border-slate-800 bg-[#171924] p-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Character Speed
                </label>
                <span className="font-mono text-sm font-bold text-amber-400">{localSettings.charWpm} WPM</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">Individual letter cadence</p>
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
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Effective Farnsworth WPM */}
            <div className="rounded-xl border border-slate-800 bg-[#171924] p-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Effective (Farnsworth) Speed
                </label>
                <span className="font-mono text-sm font-bold text-cyan-400">{localSettings.effectiveWpm} WPM</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">Spaced for beginner thinking</p>
              <input
                type="range"
                min="5"
                max={localSettings.charWpm}
                step="1"
                value={localSettings.effectiveWpm}
                onChange={(e) => handleChange('effectiveWpm', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Master Volume */}
          <div className="rounded-xl border border-slate-800 bg-[#171924] p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200">Master Output Volume</label>
              <span className="font-mono text-sm font-bold text-white">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={localSettings.volume}
              onChange={(e) => handleChange('volume', Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Atmospheric HF Static / QRM Simulation */}
          <div className="rounded-xl border border-slate-800 bg-[#171924] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">HF Band Static / Atmospheric Noise</h4>
                  <p className="text-[11px] text-slate-400">Simulate on-air HF receiver conditions for ASOC realism</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('hfNoiseEnabled', !localSettings.hfNoiseEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.hfNoiseEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.hfNoiseEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {localSettings.hfNoiseEnabled && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Static Level</span>
                  <span className="font-mono text-amber-400">
                    {Math.round((localSettings.hfNoiseVolume / 0.3) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.02"
                  value={localSettings.hfNoiseVolume}
                  onChange={(e) => handleChange('hfNoiseVolume', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTestBeep}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              Test Tone
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
