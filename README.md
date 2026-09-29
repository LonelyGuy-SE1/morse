# MORSE ACADEMY // High-Speed CW Telegraphy Tutor

> A tactile, neo-brutalist Morse code training station built for learning telegraphy from complete beginner up to **20+ WPM**.

---

## ⚡ Features

- **The Koch Method Academy**: 40 progressive lessons starting at full target cadence (**20 WPM**) with a 90% mastery threshold to unlock subsequent characters.
- **True Farnsworth Timing**: Sent with standard PARIS timing ($t_{\text{dit}} = 1.2 / \text{WPM}$) with elongated inter-character spacing to build acoustic reflex memory without counting dots and dashes.
- **Physical-Feeling Keyer Station**:
  - **Straight Key**: Spacebar/touch operation with real-time rhythm feedback and dit:dah ratio evaluation (target 1:3).
  - **Electronic Iambic Keyer (Mode A/B)**: Dual paddle simulation with auto-pulse generation and squeeze keying.
  - **Live Telegraphic Decoder**: Translates manual keying in real time as you transmit.
- **Timed Speed Certification Exam**:
  - Novice Grade (8 WPM)
  - Intermediate Grade (12 WPM)
  - Master Challenge (20 WPM)
  - Strict deduction grading (omissions, additions, substitutions) and printable Certificate of Performance.
- **Audio Reception (RX) Trainer**: Practice 5-character cipher groups, radio callsigns, and standard Q-codes.
- **Real-Time Carrier Monitor (Oscilloscope)**: HTML5 Canvas audio spectrum analyzer rendering live carrier oscillations.
- **Sample-Accurate Web Audio Engine**: Click-free raised-cosine envelope ramping (5ms) and optional HF band atmospheric static simulation.
- **Telemetry & Weak-Spot Heatmap**: Automatically pinpoints troublesome characters to guide focused drills.
- **100% Offline & Local**: Built with React 19, TypeScript, and Tailwind CSS. All data persists in browser storage with JSON backup/restore.

---

## ⌨️ Keyboard Shortcuts & Controls

| Key | Context | Action |
| --- | --- | --- |
| `Spacebar` or `K` | Transmission Keyer | Operate Straight Key (Press = Carrier ON, Release = Carrier OFF) |
| `[` or `Z` | Iambic Keyer | Left Paddle (Automatic Dits) |
| `]` or `/` | Iambic Keyer | Right Paddle (Automatic Dahs) |
| `Ctrl + R` or `F2` | Audio Copy Trainer | Replay Last Audio Sample |
| `Enter` | All Trainers | Submit & Verify Answer |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with bespoke Neo-Brutalist tactile instrumentation styling
- **Sound Engine**: Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `AnalyserNode`, `BiquadFilterNode`)
- **Visuals**: Real-time HTML5 Canvas Oscilloscope
- **Storage**: LocalStorage with schema validation and JSON export/import

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation & Run

```bash
# Navigate to project directory
cd morse

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

**SE1 Morse Academy • Clear Signals & Clean Keying**
