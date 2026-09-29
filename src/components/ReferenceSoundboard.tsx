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
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Header & Search */}
      <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Interactive Signal Encyclopedia
              </span>
              <span className="text-[10px] font-mono rounded bg-slate-800 px-2 py-0.5 text-slate-400">
                {settings.charWpm} WPM // {settings.pitch} Hz
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">Morse Reference & Soundboard</h2>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search letter, code, phonetic..."
              className="w-full rounded-xl border border-slate-700 bg-[#171926] pl-9 pr-4 py-2 font-mono text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
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
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#181b26] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Morse Cards or Q-Codes */}
      {activeTab !== 'qcodes' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCharacters.map((item) => {
            const isPlaying = activePlayingChar === item.char;
            return (
              <button
                key={item.char}
                onClick={() => handlePlayChar(item.char)}
                className={`flex flex-col items-center justify-between rounded-2xl p-4 border text-center transition-all ${
                  isPlaying
                    ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                    : 'border-slate-800 bg-[#141620] hover:border-slate-600 hover:bg-[#191c2a]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    {item.category}
                  </span>
                  <Volume2 className={`h-3.5 w-3.5 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                </div>

                <div className="my-2">
                  <div className="font-mono text-3xl font-black text-white">{item.char}</div>
                  <div className="font-mono text-base font-bold tracking-widest text-amber-400 mt-0.5">
                    {item.code}
                  </div>
                </div>

                <div className="w-full border-t border-slate-800/80 pt-1.5 text-[11px] text-slate-400 truncate">
                  {item.description || item.char}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Q-Codes & Abbreviations Reference Tables */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Q-Codes */}
          <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Radio className="h-4 w-4 text-amber-400" />
              <span>Standard Ham Radio Q-Codes</span>
            </h3>
            <div className="mt-3 space-y-2">
              {Q_CODES.map((q) => (
                <div
                  key={q.code}
                  onClick={() => handlePlayChar(q.code)}
                  className="flex items-start justify-between rounded-xl p-2.5 bg-[#171926] hover:bg-[#1e2235] border border-slate-800 cursor-pointer transition-colors"
                >
                  <div className="font-mono text-sm font-bold text-amber-400 mr-3">
                    {q.code}
                  </div>
                  <div className="text-xs text-slate-300 flex-1">{q.meaning}</div>
                  <Volume2 className="h-3.5 w-3.5 text-slate-500 ml-2 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* CW Abbreviations */}
          <div className="rounded-2xl border border-slate-800 bg-[#12141d] p-5 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span>Telegraphic CW Abbreviations & Slang</span>
            </h3>
            <div className="mt-3 space-y-2">
              {CW_ABBREVIATIONS.map((ab) => (
                <div
                  key={ab.abbrev}
                  onClick={() => handlePlayChar(ab.abbrev)}
                  className="flex items-start justify-between rounded-xl p-2.5 bg-[#171926] hover:bg-[#1e2235] border border-slate-800 cursor-pointer transition-colors"
                >
                  <div className="font-mono text-sm font-bold text-emerald-400 mr-3">
                    {ab.abbrev}
                  </div>
                  <div className="text-xs text-slate-300 flex-1">{ab.meaning}</div>
                  <Volume2 className="h-3.5 w-3.5 text-slate-500 ml-2 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
