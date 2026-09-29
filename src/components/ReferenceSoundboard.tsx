import { useState } from 'react';
import { 
  MORSE_DICTIONARY, 
  Q_CODES, 
  CW_ABBREVIATIONS 
} from '../utils/morseData';
import { audioEngine } from '../services/audioEngine';
import type { AudioSettings } from '../types/morse';
import { 
  Volume2, 
  Search, 
  Radio, 
  FileCode
} from 'lucide-react';

interface ReferenceSoundboardProps {
  settings: AudioSettings;
}

export const ReferenceSoundboard = ({ settings }: ReferenceSoundboardProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'letter' | 'number' | 'punctuation' | 'prosign' | 'qcodes'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePlayingChar, setActivePlayingChar] = useState<string | null>(null);

  const isBrutal = settings.theme === 'neo-brutal';
  const isDark = settings.theme === 'apple-dark';

  const handlePlayChar = async (char: string) => {
    setActivePlayingChar(char);
    await audioEngine.playSequence(char, undefined, () => {
      setActivePlayingChar(null);
    });
  };

  const filteredCharacters = MORSE_DICTIONARY.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.char.toLowerCase().includes(q) ||
      item.code.includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header & Filter Controls */}
      <div className={`p-6 transition-all ${
        isBrutal
          ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
          : isDark
          ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
          : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 border-inherit">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
                isBrutal ? 'text-[#ff5500]' : 'text-blue-500'
              }`}>
                Morse Signal Encyclopedia
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                isBrutal ? 'bg-neutral-900 text-white' : 'bg-white/[0.08] text-neutral-300'
              }`}>
                {settings.charWpm} WPM // {settings.pitch} Hz
              </span>
            </div>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">Interactive Soundboard</h2>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol, code, name..."
              className={`w-full pl-10 pr-4 py-2 text-xs font-mono rounded-xl outline-none transition-all ${
                isBrutal
                  ? 'bg-[#f5f4ee] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#18181b] focus:border-[#ff5500]'
                  : isDark
                  ? 'bg-white/[0.05] border border-white/[0.1] text-white focus:border-blue-500'
                  : 'bg-neutral-50 border border-neutral-300'
              }`}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Symbols' },
            { id: 'letter', label: 'Alphabet (A-Z)' },
            { id: 'number', label: 'Numbers (0-9)' },
            { id: 'punctuation', label: 'Punctuation' },
            { id: 'prosign', label: 'Pro-signs (<AR>, <SK>...)' },
            { id: 'qcodes', label: 'Q-Codes & CW Slang' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id
                  ? isBrutal
                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#ff5500]'
                    : isDark
                    ? 'bg-white text-neutral-950 shadow-md font-semibold'
                    : 'bg-neutral-900 text-white shadow-sm font-semibold'
                  : isBrutal
                  ? 'bg-[#f5f4ee] border-2 border-neutral-900 hover:bg-[#ffcc00]'
                  : 'bg-white/[0.04] text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Cards */}
      {activeTab !== 'qcodes' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredCharacters.map((item) => {
            const isPlaying = activePlayingChar === item.char;
            return (
              <button
                key={item.char}
                onClick={() => handlePlayChar(item.char)}
                className={`flex flex-col items-center justify-between p-4 rounded-2xl text-center transition-all ${
                  isPlaying
                    ? isBrutal
                      ? 'border-2 border-neutral-900 bg-[#ffcc00] text-neutral-900 shadow-[4px_4px_0px_0px_#18181b] scale-105'
                      : 'border-2 border-blue-500 bg-blue-500/20 text-white scale-105 shadow-lg'
                    : isBrutal
                    ? 'border-2 border-neutral-900 bg-white text-neutral-900 shadow-[3px_3px_0px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bg-[#faf9f5]'
                    : isDark
                    ? 'border border-white/[0.08] bg-[#141418] text-white hover:bg-white/[0.06] hover:border-white/[0.15]'
                    : 'border border-neutral-200 bg-white text-neutral-900 shadow-sm hover:border-neutral-300'
                }`}
              >
                <div className="flex w-full items-center justify-between text-[10px] font-mono opacity-50 uppercase font-bold">
                  <span>{item.category}</span>
                  <Volume2 className={`h-3 w-3 ${isPlaying ? 'text-[#ff5500] animate-pulse' : ''}`} />
                </div>

                <div className="my-2">
                  <div className="font-mono text-3xl font-black">{item.char}</div>
                  <div className="font-mono text-base font-black tracking-widest text-[#ff5500] mt-0.5">
                    {item.code}
                  </div>
                </div>

                <div className="w-full border-t border-inherit pt-1 text-[11px] opacity-70 truncate font-medium">
                  {item.description || item.char}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Q-Codes Tables */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 transition-all ${
            isBrutal
              ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
              : isDark
              ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
              : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
          }`}>
            <h3 className="text-base font-black flex items-center gap-2 border-b pb-3 mb-3 border-inherit">
              <Radio className="h-4 w-4 text-[#ff5500]" />
              <span>Standard Ham Radio Q-Codes</span>
            </h3>
            <div className="space-y-2">
              {Q_CODES.map((q) => (
                <div
                  key={q.code}
                  onClick={() => handlePlayChar(q.code)}
                  className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isBrutal
                      ? 'bg-[#f5f4ee] border-2 border-neutral-900 hover:bg-[#ffcc00] shadow-[2px_2px_0px_0px_#18181b]'
                      : isDark
                      ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]'
                      : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  <div className="font-mono text-sm font-black text-[#ff5500] mr-3">
                    {q.code}
                  </div>
                  <div className="text-xs opacity-80 flex-1 font-medium">{q.meaning}</div>
                  <Volume2 className="h-3.5 w-3.5 opacity-50 ml-2 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 transition-all ${
            isBrutal
              ? 'rounded-3xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#18181b]'
              : isDark
              ? 'rounded-3xl border border-white/[0.08] bg-[#141418] shadow-xl'
              : 'rounded-3xl border border-neutral-200 bg-white shadow-sm'
          }`}>
            <h3 className="text-base font-black flex items-center gap-2 border-b pb-3 mb-3 border-inherit">
              <FileCode className="h-4 w-4 text-[#ff5500]" />
              <span>Telegraphic CW Abbreviations</span>
            </h3>
            <div className="space-y-2">
              {CW_ABBREVIATIONS.map((ab) => (
                <div
                  key={ab.abbrev}
                  onClick={() => handlePlayChar(ab.abbrev)}
                  className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isBrutal
                      ? 'bg-[#f5f4ee] border-2 border-neutral-900 hover:bg-[#ffcc00] shadow-[2px_2px_0px_0px_#18181b]'
                      : isDark
                      ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]'
                      : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  <div className="font-mono text-sm font-black text-[#ff5500] mr-3">
                    {ab.abbrev}
                  </div>
                  <div className="text-xs opacity-80 flex-1 font-medium">{ab.meaning}</div>
                  <Volume2 className="h-3.5 w-3.5 opacity-50 ml-2 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
