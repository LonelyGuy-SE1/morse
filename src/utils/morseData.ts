import type { MorseCharacter, KochLesson } from '../types/morse';

// Standard International Morse Code Table
export const MORSE_TABLE: Record<string, string> = {
  // Letters
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',

  // Numbers
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----',

  // Punctuation & Special
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '/': '-..-.',
  '=': '-...-',
  '-': '-....-',
  ':': '---...',
  ';': '-.-.-.',
  '(': '-.--.',
  ')': '-.--.-',
  '"': '.-..-.',
  "'": '.----.',
  '!': '-.-.--',
  '@': '.--.-.',
  '&': '.-...',
  '+': '.-.-.',

  // Pro-signs (formal ITU/Amateur conventions)
  '<AR>': '.-.-.',     // End of message / Over
  '<SK>': '...-.-',    // End of work / Final sign-off
  '<BT>': '-...-',     // Break / Paragraph divider
  '<AS>': '.-...',     // Wait / Standby
  '<KN>': '-.--.',     // Go ahead specified station only
  '<HH>': '........',  // Error / correction
  '<SOS>': '...---...',// Distress call
};

// Inverted lookup map for decoding
export const REVERSE_MORSE_TABLE: Record<string, string> = Object.entries(
  MORSE_TABLE
).reduce((acc, [char, code]) => {
  acc[code] = char;
  return acc;
}, {} as Record<string, string>);

// Comprehensive Character Details
export const MORSE_DICTIONARY: MorseCharacter[] = [
  // Letters
  { char: 'A', code: '.-', description: 'Alpha', category: 'letter' },
  { char: 'B', code: '-...', description: 'Bravo', category: 'letter' },
  { char: 'C', code: '-.-.', description: 'Charlie', category: 'letter' },
  { char: 'D', code: '-..', description: 'Delta', category: 'letter' },
  { char: 'E', code: '.', description: 'Echo (Single Dit)', category: 'letter' },
  { char: 'F', code: '..-.', description: 'Foxtrot', category: 'letter' },
  { char: 'G', code: '--.', description: 'Golf', category: 'letter' },
  { char: 'H', code: '....', description: 'Hotel (4 Dits)', category: 'letter' },
  { char: 'I', code: '..', description: 'India (2 Dits)', category: 'letter' },
  { char: 'J', code: '.---', description: 'Juliett', category: 'letter' },
  { char: 'K', code: '-.-', description: 'Kilo (Standard invitation to transmit)', category: 'letter' },
  { char: 'L', code: '.-..', description: 'Lima', category: 'letter' },
  { char: 'M', code: '--', description: 'Mike (2 Dahs)', category: 'letter' },
  { char: 'N', code: '-.', description: 'November', category: 'letter' },
  { char: 'O', code: '---', description: 'Oscar (3 Dahs)', category: 'letter' },
  { char: 'P', code: '.--.', description: 'Papa', category: 'letter' },
  { char: 'Q', code: '--.-', description: 'Quebec', category: 'letter' },
  { char: 'R', code: '.-.', description: 'Romeo', category: 'letter' },
  { char: 'S', code: '...', description: 'Sierra (3 Dits)', category: 'letter' },
  { char: 'T', code: '-', description: 'Tango (Single Dah)', category: 'letter' },
  { char: 'U', code: '..-', description: 'Uniform', category: 'letter' },
  { char: 'V', code: '...-', description: 'Victor', category: 'letter' },
  { char: 'W', code: '.--', description: 'Whiskey', category: 'letter' },
  { char: 'X', code: '-..-', description: 'X-ray', category: 'letter' },
  { char: 'Y', code: '-.--', description: 'Yankee', category: 'letter' },
  { char: 'Z', code: '--..', description: 'Zulu', category: 'letter' },

  // Numbers
  { char: '1', code: '.----', description: 'One', category: 'number' },
  { char: '2', code: '..---', description: 'Two', category: 'number' },
  { char: '3', code: '...--', description: 'Three', category: 'number' },
  { char: '4', code: '....-', description: 'Four', category: 'number' },
  { char: '5', code: '.....', description: 'Five', category: 'number' },
  { char: '6', code: '-....', description: 'Six', category: 'number' },
  { char: '7', code: '--...', description: 'Seven', category: 'number' },
  { char: '8', code: '---..', description: 'Eight', category: 'number' },
  { char: '9', code: '----.', description: 'Nine', category: 'number' },
  { char: '0', code: '-----', description: 'Zero', category: 'number' },

  // Punctuation
  { char: '.', code: '.-.-.-', description: 'Full Stop / Period', category: 'punctuation' },
  { char: ',', code: '--..--', description: 'Comma', category: 'punctuation' },
  { char: '?', code: '..--..', description: 'Question Mark / Request repeat', category: 'punctuation' },
  { char: '/', code: '-..-.', description: 'Fraction Bar / Slash (portable callsigns)', category: 'punctuation' },
  { char: '=', code: '-...-', description: 'Equals / Break', category: 'punctuation' },

  // Pro-signs
  { char: '<AR>', code: '.-.-.', description: 'End of message / Transmission over', category: 'prosign' },
  { char: '<SK>', code: '...-.-', description: 'Silent Key / End of contact', category: 'prosign' },
  { char: '<BT>', code: '-...-', description: 'Break / Paragraph separator', category: 'prosign' },
  { char: '<AS>', code: '.-...', description: 'Please wait / Stand by', category: 'prosign' },
  { char: '<KN>', code: '-.--.', description: 'Go ahead only named station', category: 'prosign' },
  { char: '<SOS>', code: '...---...', description: 'International Distress Call', category: 'prosign' },
];

// Koch Method Sequence (40 Levels)
// Starts with K and M, progressively introducing letters, numbers, and prosigns
export const KOCH_ORDER: string[] = [
  'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O',
  'W', 'I', '.', 'N', 'J', 'E', 'F', '0', 'Y', 'V',
  ',', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8',
  'B', '?', '4', '2', '7', 'C', '1', 'D', '6', 'X'
];

export const KOCH_LESSONS: KochLesson[] = KOCH_ORDER.map((char, index) => {
  const allChars = KOCH_ORDER.slice(0, index + 1);
  return {
    level: index + 1,
    newChar: char,
    allChars,
    description: `Lesson ${index + 1}: Introducing "${char}" (${MORSE_TABLE[char] || ''}). Pool: ${allChars.join(' ')}`,
  };
});

// Ham Radio Q-Codes (Essential for On-Air CW & Telegraphy Training)
export const Q_CODES: { code: string; meaning: string }[] = [
  { code: 'QRM', meaning: 'Your transmission is being interfered with (Man-made noise)' },
  { code: 'QRN', meaning: 'I am troubled by static / atmospheric noise' },
  { code: 'QRO', meaning: 'Increase transmitter power' },
  { code: 'QRP', meaning: 'Decrease power / Low power operation (< 5W)' },
  { code: 'QRT', meaning: 'Stop sending / Closing down station' },
  { code: 'QRZ', meaning: 'Who is calling me?' },
  { code: 'QSL', meaning: 'I acknowledge receipt / Confirming contact' },
  { code: 'QSO', meaning: 'Can you communicate with...? / Direct radio contact' },
  { code: 'QSY', meaning: 'Change transmission frequency' },
  { code: 'QTH', meaning: 'My location is...' },
  { code: 'QRX', meaning: 'Stand by / I will call you again' },
  { code: 'QSB', meaning: 'Your signals are fading' },
];

// Common Ham Radio CW Abbreviations & Slang
export const CW_ABBREVIATIONS: { abbrev: string; meaning: string }[] = [
  { abbrev: 'CQ', meaning: 'General call to all stations ("Seek you")' },
  { abbrev: 'DE', meaning: 'From (used before callsign, e.g., CQ DE VU2XYZ)' },
  { abbrev: '73', meaning: 'Best regards' },
  { abbrev: '88', meaning: 'Love and kisses' },
  { abbrev: 'RST', meaning: 'Readability, Signal Strength, Tone report (e.g. 599)' },
  { abbrev: 'UR', meaning: 'Your' },
  { abbrev: 'AGN', meaning: 'Again' },
  { abbrev: 'BK', meaning: 'Break / Break-in' },
  { abbrev: 'CFM', meaning: 'Confirm' },
  { abbrev: 'CPY', meaning: 'Copy' },
  { abbrev: 'ES', meaning: 'And (&)' },
  { abbrev: 'FB', meaning: 'Fine Business (Excellent)' },
  { abbrev: 'GA', meaning: 'Good Afternoon' },
  { abbrev: 'GE', meaning: 'Good Evening' },
  { abbrev: 'GM', meaning: 'Good Morning' },
  { abbrev: 'HW?', meaning: 'How do you copy?' },
  { abbrev: 'K', meaning: 'Go ahead / Invitation to transmit' },
  { abbrev: 'OM', meaning: 'Old Man (male amateur operator)' },
  { abbrev: 'YL', meaning: 'Young Lady (female operator)' },
  { abbrev: 'OP', meaning: 'Operator' },
  { abbrev: 'RIG', meaning: 'Transceiver / Radio equipment' },
  { abbrev: 'ANT', meaning: 'Antenna' },
  { abbrev: 'TU', meaning: 'Thank you' },
  { abbrev: 'WX', meaning: 'Weather' },
];

// Realistic Callsign Prefixes for Telegraphy Practice
export const CALLSIGN_PREFIXES = [
  'VU2', 'VU3', 'AT2', '4S7', '9N1', 'A52', 'S21',
  'W1', 'K6', 'JA1', 'DL3', 'G4', 'VK2', 'ZS6', 'PY2'
];

export const CALLSIGN_SUFFIXES = [
  'ABC', 'XYZ', 'CW', 'HAM', 'DX', 'RAD', 'KEY', 'OSC', 'NET', 'QRP', 'IND', 'DEL', 'MUM', 'BLR', 'HYD'
];

// Standard Plain Language Telegram Messages
export const SPEED_EXAM_PLAIN_MESSAGES: string[] = [
  'AMATEUR RADIO STATION OPERATING AT TWENTY METERS BAND REPORTS EXCELLENT PROPAGATION CONDITIONS WEATHER SUNNY TEMPERATURE TWENTY FIVE DEGREES SEVENTY THREE',
  'ALL OPERATORS PREPARING FOR ANNUAL FIELD DAY MUST CHECK EMERGENCY POWER GENERATORS DIPOLES AND VERTICAL ANTENNAS BEFORE COMMENCEMENT OF CONTEST',
  'INTERNATIONAL TELECOMMUNICATION UNION RECOMMENDS CONTINUOUS WAVE TELEGRAPHY PROFICIENCY FOR HIGH FREQUENCY EMERGENCY RADIO OPERATIONS',
  'SPECIAL EVENT STATION ACTIVE ON ALL HIGH FREQUENCY BANDS TO COMMEMORATE NATIONAL SCIENCE DAY PLEASE SEND YOUR QSL CARD VIA BUREAU',
  'PLEASE BE ADVISED SIGNAL ON SEVEN DECIMAL ZERO FIVE MEGAHERTZ SHOWS SLIGHT DRIFT PLEASE ADJUST SIDERTONE OSCILLATOR AND CONFIRM RECEPTION'
];
export const ASOC_PLAIN_MESSAGES = SPEED_EXAM_PLAIN_MESSAGES;

// Utility: Encode text to Morse code string (with spaces between elements and / between words)
export function encodeToMorse(text: string): string {
  const clean = text.toUpperCase().trim();
  const words = clean.split(/\s+/);
  return words
    .map((word) =>
      word
        .split('')
        .map((ch) => MORSE_TABLE[ch] || '')
        .filter(Boolean)
        .join(' ')
    )
    .join(' / ');
}

// Utility: Decode Morse code string to plain text
export function decodeFromMorse(morse: string): string {
  const words = morse.trim().split(/\s*\/\s*|\s{3,}/);
  return words
    .map((word) => {
      const letters = word.trim().split(/\s+/);
      return letters.map((code) => REVERSE_MORSE_TABLE[code] || '?').join('');
    })
    .join(' ');
}

// Generator: Random 5-character groups (Standard Telegraphy Cipher Groups)
export function generateRandomGroups(
  groupCount: number = 5,
  allowedChars?: string[]
): string[] {
  const pool = allowedChars && allowedChars.length > 0 
    ? allowedChars 
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  
  const groups: string[] = [];
  for (let g = 0; g < groupCount; g++) {
    let group = '';
    for (let c = 0; c < 5; c++) {
      const idx = Math.floor(Math.random() * pool.length);
      group += pool[idx];
    }
    groups.push(group);
  }
  return groups;
}

// Generator: Random Ham Radio Callsign
export function generateRandomCallsign(): string {
  const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const suffix = CALLSIGN_SUFFIXES[Math.floor(Math.random() * CALLSIGN_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

// Generator: Random Q-Code or Abbreviation
export function generateRandomRadioSnippet(): string {
  const isQCode = Math.random() > 0.5;
  if (isQCode) {
    const q = Q_CODES[Math.floor(Math.random() * Q_CODES.length)];
    return `${q.code} ?`;
  }
  const ab = CW_ABBREVIATIONS[Math.floor(Math.random() * CW_ABBREVIATIONS.length)];
  return ab.abbrev;
}
