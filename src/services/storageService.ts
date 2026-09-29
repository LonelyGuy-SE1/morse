import type { AudioSettings, UserStats, AsocExamResult } from '../types/morse';

const STORAGE_KEY_SETTINGS = 'ditdah_audio_settings_v1';
const STORAGE_KEY_STATS = 'ditdah_user_stats_v1';

export const DEFAULT_SETTINGS: AudioSettings = {
  pitch: 650,
  charWpm: 20,
  effectiveWpm: 8,
  volume: 0.75,
  hfNoiseEnabled: false,
  hfNoiseVolume: 0.12,
  attackDecayMs: 5,
  theme: 'neo-brutal',
};

export const DEFAULT_STATS: UserStats = {
  totalPracticeTimeSec: 0,
  sessionsCompleted: 0,
  charactersHeard: 0,
  charactersSent: 0,
  accuracyHistory: [],
  charAccuracyMap: {},
  kochLevelUnlocked: 1,
  examScores: [],
};

export class StorageService {
  public static getSettings(): AudioSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: AudioSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  public static getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      if (data) {
        return { ...DEFAULT_STATS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
    return { ...DEFAULT_STATS };
  }

  public static saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  }

  public static recordSession(
    mode: string,
    accuracy: number,
    wpm: number,
    heardCount: number,
    durationSec: number,
    charStats?: Record<string, { correct: boolean }>
  ): void {
    const stats = this.getStats();

    stats.sessionsCompleted += 1;
    stats.totalPracticeTimeSec += durationSec;
    stats.charactersHeard += heardCount;

    // Log history
    stats.accuracyHistory.push({
      date: new Date().toISOString(),
      accuracy,
      wpm,
      mode,
    });

    // Keep history manageable
    if (stats.accuracyHistory.length > 100) {
      stats.accuracyHistory = stats.accuracyHistory.slice(-100);
    }

    // Update per-character accuracy
    if (charStats) {
      for (const [char, result] of Object.entries(charStats)) {
        if (!stats.charAccuracyMap[char]) {
          stats.charAccuracyMap[char] = { attempts: 0, correct: 0 };
        }
        stats.charAccuracyMap[char].attempts += 1;
        if (result.correct) {
          stats.charAccuracyMap[char].correct += 1;
        }
      }
    }

    this.saveStats(stats);
  }

  public static unlockKochLevel(newLevel: number): void {
    const stats = this.getStats();
    if (newLevel > stats.kochLevelUnlocked) {
      stats.kochLevelUnlocked = Math.min(newLevel, 40);
      this.saveStats(stats);
    }
  }

  public static recordExamResult(result: AsocExamResult): void {
    const stats = this.getStats();
    stats.examScores.unshift(result);
    if (stats.examScores.length > 20) {
      stats.examScores = stats.examScores.slice(0, 20);
    }
    this.saveStats(stats);
  }

  public static exportData(): string {
    const data = {
      settings: this.getSettings(),
      stats: this.getStats(),
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  public static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.stats) this.saveStats(data.stats);
      return true;
    } catch {
      return false;
    }
  }

  public static resetProgress(): void {
    localStorage.removeItem(STORAGE_KEY_STATS);
  }
}
