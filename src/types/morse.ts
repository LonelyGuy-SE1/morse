export type PracticeMode = 
  | 'koch' 
  | 'copy' 
  | 'keyer' 
  | 'exam' 
  | 'reference' 
  | 'stats';

export type KeyerType = 'straight' | 'iambic-a' | 'iambic-b';

export type CopySourceType = 
  | 'koch' 
  | 'random-groups' 
  | 'callsigns' 
  | 'q-codes' 
  | 'words' 
  | 'custom';

export interface MorseCharacter {
  char: string;
  code: string;       // e.g. ".-" for A
  description?: string;
  category: 'letter' | 'number' | 'punctuation' | 'prosign';
}

export interface KochLesson {
  level: number;
  newChar: string;
  allChars: string[];
  description: string;
}

export type ThemeMode = 'apple-dark' | 'neo-brutal' | 'apple-light';

export interface AudioSettings {
  pitch: number;            // Hz (default 650)
  charWpm: number;          // Target character speed (default 20)
  effectiveWpm: number;     // Farnsworth spacing speed (default 8)
  volume: number;           // 0.0 - 1.0
  hfNoiseEnabled: boolean;  // HF radio atmospheric static simulation
  hfNoiseVolume: number;    // 0.0 - 0.5
  attackDecayMs: number;    // Click suppression envelope time (default 5ms)
  theme: ThemeMode;         // 'apple-dark' | 'neo-brutal' | 'apple-light'
}

export interface UserStats {
  totalPracticeTimeSec: number;
  sessionsCompleted: number;
  charactersHeard: number;
  charactersSent: number;
  accuracyHistory: { date: string; accuracy: number; wpm: number; mode: string }[];
  charAccuracyMap: Record<string, { attempts: number; correct: number }>;
  kochLevelUnlocked: number;
  examScores: AsocExamResult[];
}

export interface AsocExamConfig {
  grade: 'general' | 'restricted'; // General: 12-20 WPM, Restricted: 8-10 WPM
  wpm: number;
  durationMinutes: number;
  groupCount: number;             // standard 5-character cipher groups
  plainTextWordCount: number;
}

export interface AsocExamResult {
  id: string;
  date: string;
  grade: string;
  wpm: number;
  cipherAccuracy: number;
  plainAccuracy: number;
  txAccuracy?: number;
  passed: boolean;
  errors: {
    omissions: number;
    substitutions: number;
    additions: number;
  };
  details: string;
}

export interface TimingPulse {
  type: 'dit' | 'dah';
  durationMs: number;
  idealDurationMs: number;
  timestamp: number;
}
