# DITDAH // ASOC Morse Code Academy & CW Tutor

> A tactile, retro-modern CW telegraphy training platform designed to take amateur radio candidates from complete beginner (0 WPM) up to 20+ WPM for the **Amateur Station Operator's Certificate (ASOC)** examination.

---

## ⚡ Key Highlights

- **Koch Method Academy**: 40 progressive lessons starting at full 20 WPM cadence with a strict 90% mastery threshold to unlock subsequent characters.
- **True Farnsworth Timing**: Sent with standard PARIS timing ($t_{\text{dit}} = 1.2 / \text{WPM}$) with extended inter-character delays to eliminate the habit of "counting dots and dashes".
- **Official ASOC Examination Simulator**: Mock exam adhering to Ministry of Communications (WPC Wing) standards:
  - Restricted Grade (8 WPM)
  - General Grade (12 WPM)
  - Master Challenge (20 WPM)
  - Official deduction grading (omissions, additions, substitutions) and printable Certificate of Performance.
- **Hardware-Accurate Transmission (TX) Keyer**:
  - **Straight Key**: Spacebar/touch operation with real-time rhythm feedback and dit:dah ratio evaluation (target 1:3).
  - **Electronic Iambic Keyer (Mode A/B)**: Dual paddle simulation with auto-pulse generation and squeeze keying.
  - **Live Telegraphic Decoder**: Translates your manual keying in real time.
- **Reception (RX) Audio Trainer**: Practice 5-character cipher groups, Indian/international call signs (`VU2`, `VU3`, `4S7`, `9N1`), and standard Q-codes.
- **Sample-Accurate Web Audio Engine**: Click-free raised-cosine envelope ramping (5ms) and optional HF band atmospheric static simulation.
- **Telemetry & Weak-Spot Heatmap**: Pinpoints problematic characters (e.g. `B` vs `6`, `S` vs `H`) to guide your daily drills.
- **100% Offline & Local**: Built with React 19, TypeScript, and Tailwind CSS. All data persists in browser storage with JSON backup/restore.

---

## 📻 Pedagogical Approach: The Koch Method & Farnsworth Timing

### Why Most Morse Learners Plateau at 8–10 WPM
Beginners who learn Morse by visually memorizing charts or listening to slow, dragged-out dits and dahs inevitably count elements (`. . . -` $\rightarrow$ "three dots and a dash... that's V"). This cognitive translation collapses when audio speeds exceed 10 WPM.

### The DITDAH Solution
1. **Full Target Speed from Day 1**: Characters are always sounded at your target speed (**20 WPM**), training your brain to recognize each letter as an indivisible acoustic musical rhythm.
2. **Farnsworth Spacing**: The spacing *between* characters and words is extended (e.g. 8 WPM effective spacing) to provide reflection time without slowing down the character's internal cadence.
3. **Step-by-Step Character Introduction**: Ludwig Koch's psychological method starts with just two letters (`K` and `M`). Once you achieve $\ge 90\%$ accuracy, the next character is introduced.

---

## ⌨️ Keyboard Shortcuts & Hardware Controls

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
- **Styling**: Tailwind CSS v4 with bespoke neo-tactile ham radio instrumentation styling
- **Sound Engine**: Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `AnalyserNode`, `BiquadFilterNode`)
- **Visuals**: Real-time HTML5 Canvas CRT Oscilloscope with phosphor trail rendering
- **Storage**: LocalStorage with schema validation and JSON export/import

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation & Run

```bash
# Navigate to the project directory
cd morse

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in any modern browser (Chrome, Firefox, Safari, Edge).

---

## 📜 ASOC Examination Syllabus Reference

Under the Indian Wireless Telegraphy (Amateur Service) Rules, the practical Morse code test consists of:
- **Receiving**: 5-minute transmission of plain language and 5-letter cipher groups.
- **Sending**: 5-minute transmission test using an approved key.
- **Scoring**: Candidates are penalized for uncorrected mistakes, omissions, or extra characters. Passing marks require $\ge 50\%$ for Restricted and $\ge 60\%$ for General grade.

---

**73 de DITDAH Academy • Good DX & Clear Signals!**
