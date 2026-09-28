# ⚡ Analyzer(VCD)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Canvas API](https://img.shields.io/badge/Canvas_API-FF6F00?style=for-the-badge&logo=html5&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-00C853?style=for-the-badge)

> A high-performance, zero-dependency web logic analyzer and waveform viewer. Built with a heavy cyberpunk aesthetic, it parses standard `.vcd` files and natively compiles tabular `.out` files on the fly — all inside your browser.

---

## 🎯 Overview

Hardware simulation files can be massive and difficult to read. **Analyzer(VCD)** leverages the raw rendering power of the **HTML5 Canvas API** to draw thousands of data points and logic buses without DOM lag.

Whether you are debugging standard Value Change Dump (`.vcd`) files from tools like Icarus Verilog, or working through the **Nand2Tetris** curriculum using `.out` files from the hardware simulator, this tool provides instant visual telemetry, precise timing measurements, and multi-radix data inspection — all from a single HTML page.

---

## ✨ Core Features

- **Cyberpunk Glassmorphism UI** — Liquid neon orb backgrounds, frosted glass panels (`backdrop-filter`), neon-glow hex buses, and sci-fi typography (`Orbitron`, `Audiowide`, `Fira Code`).
- **Nand2Tetris `.out` Compiler** — Upload raw `.out` table files directly. The parser auto-detects **sequential** (clocked, time-column present) vs. **combinational** chips and compiles the pipe-delimited tables into VCD event syntax in real-time before rendering.
- **Standard VCD Parser** — Full `$var wire`, `$scope`, `#time`, scalar (`0`/`1`), and multi-bit bus (`bXXXX`) parsing with correct time-stepping.
- **Advanced Trigger Search** — Type a Hex (`0xFF`), Decimal, or Binary (`0b1010`) value to instantly scan the entire timeline. The engine drops cursor A at the exact nanosecond of the first occurrence and auto-scrolls the viewport to center on it, highlighting matched bus segments with a golden neon glow.
- **Dual-Cursor Delta Time (Δt)** — Calculate precise gate delays. Double-click to alternate between an Emerald (cursor A) and a Rose (cursor B) cursor; the header instantly displays the nanosecond difference between them.
- **Multi-Radix Formatting** — Seamlessly cycle data bus display between **Hexadecimal**, **Decimal**, and raw **Binary**. The search box value auto-converts when you switch radix.
- **Smart Canvas Truncation** — Deep 16-bit binary strings dynamically truncate (e.g., `0b0000..`) to fit inside their canvas diamond polygons, while a custom un-clippable global tooltip reveals the full data string on hover.
- **Drag-to-Reorder Signals** — Click and drag signal names in the sidebar to reorder waveform rows live.
- **End-of-Simulation Easter Eggs** — A random sci-fi tagline (e.g., *"SIGNAL TERMINATED"*, *"SYSTEM OFFLINE"*) is rendered vertically at the end of the timeline on every file load.
- **Wayland / Hyprland Optimized** — A physics-based velocity dampener (`zoomIntensity` capped at 3%) handles ultra-sensitive, high-frequency touchpad micro-scroll events cleanly on modern Linux compositors.

---

## 🏗️ Architecture

The codebase is **~608 lines** across 5 files, strictly following **Separation of Concerns** in a 3-module pipeline:

```
frontend/
├── index.html      ─  58 lines   ─  Semantic shell, glass panels, canvas mount
├── styles.css      ─ 106 lines   ─  Glassmorphism, orb animations, neon palette
├── parser.js       ─ 107 lines   ─  VCD parser + .out→VCD compiler + radix utils
├── app.js          ─ 204 lines   ─  State machine, DOM events, physics, search
└── renderer.js     ─ 138 lines   ─  Pure Canvas 2D drawing engine
```

| Module | Role | What It Does |
| :--- | :--- | :--- |
| **`parser.js`** | The Brain | Regex VCD parsing, `.out`→VCD compilation (sequential & combinational detection), `formatValue()` radix conversion, `getValueAtTime()` binary search. |
| **`app.js`** | The Nervous System | Central `state` object, file upload handler, radix toggle, search-to-cursor pipeline, click-drag panning, scroll-zoom with velocity damping, double-click/double-tap cursor placement, drag-to-reorder sidebar, and mouse-follow tooltip logic. |
| **`renderer.js`** | The Paintbrush | Pure Canvas 2D calls — adaptive time grid, scalar high/low waveforms with cyan glow and fill, bus diamond polygons with neon purple stroke, text truncation with `measureText()`, dual cursor lines, Δt shaded region, dashed hover cursor with time badge, and vertical end-of-sim text. |

---

## 🚀 Getting Started

This project is **100% Vanilla HTML / CSS / JS** — zero `node_modules`, no bundlers, no build steps.

### 1. Clone

```bash
git clone https://github.com/omchandra0907-jpg/Analyzer-VCD-.git
cd Analyzer-VCD-
```

### 2. Serve

A local server is needed because the scripts use module-level scoping across files:

```bash
# Python
python3 -m http.server 8000 -d frontend

# Or Node
npx serve frontend

# Or PHP
php -S localhost:8000 -t frontend
```

### 3. Open

Navigate to **`http://localhost:8000`** and click **LOAD .VCD** or **LOAD .OUT** to drop a file into the analyzer.

---

## ⌨️ Controls

| Action | Desktop | Touch |
| :--- | :--- | :--- |
| **Zoom Timeline** | Mouse Wheel / Touchpad Scroll | — |
| **Pan Canvas** | Left-Click + Drag | Single Finger Swipe |
| **Place Cursor A** | Double Left-Click (1st) | Double Tap (1st) |
| **Place Cursor B** | Double Left-Click (2nd) | Double Tap (2nd) |
| **Reset Cursors** | Click `RESET` button | Tap `RESET` button |
| **Reorder Signals** | Drag sidebar names | Long Press + Drag |
| **View Full Bus Value** | Hover over truncated bus | Tap truncated bus |
| **Cycle Radix** | Click `FORMAT` button | Tap `FORMAT` button |
| **Search Value** | Type in search box (`0xFF`, `0b1010`, `255`) | Same |

---

## 📂 Supported File Formats

### `.vcd` — Value Change Dump (IEEE 1364)

Standard waveform format generated by digital simulators (Icarus Verilog, Verilator, ModelSim, etc.). The parser handles:
- `$var wire <width> <symbol> <name> $end` declarations
- `$timescale`, `$scope`, `$upscope`, `$enddefinitions` headers
- `#<time>` timestamps
- Scalar changes: `0A`, `1A`
- Multi-bit bus changes: `b10110 A`

### `.out` — Nand2Tetris Hardware Simulator Output

Pipe-delimited truth tables exported from the Nand2Tetris hardware simulator. The compiler auto-detects:

| Type | Detection | Time Mapping |
| :--- | :--- | :--- |
| **Sequential** (e.g., RAM, PC) | First column header is `time` | `time × 10 ns` |
| **Combinational** (e.g., And, Mux) | No `time` column | Row index `× 10 ns` |

All signal values are converted to 16-bit binary VCD events.

---

## 🎨 Design System

| Element | Value |
| :--- | :--- |
| **Primary (Cyan)** | `#00f0ff` — grid lines, wire signals, tooltips, search glow |
| **Secondary (Rose)** | `#ff007f` — cursor B, Δt display, upload buttons, end-of-sim line |
| **Accent (Violet)** | `#7000ff` / `#b266ff` — bus polygons, tool buttons, orb-3 |
| **Highlight (Gold)** | `#ffee00` — search-matched bus segments |
| **Cursor A (Emerald)** | `#00ff66` — first timing cursor |
| **Body Font** | `Fira Code` (monospace) |
| **Display Font** | `Orbitron` (headings, values, grid labels) |
| **Title Font** | `Audiowide` (app title, end-of-sim text) |

---

## 🛠️ Technical Details

- **Canvas Sizing** — Dynamically computed: `width = max(800, endX + 180)`, `height = max(600, rows × 60 + 40)`.
- **Adaptive Grid** — Grid step auto-scales with zoom: `10ns → 20ns → 50ns → 100ns` as `timeScale` decreases.
- **Zoom Physics** — Intensity is `1 + min(|deltaY| × 0.001, 0.03)`, clamped to `[0.1, 150]` scale range — silky smooth on both discrete mouse wheels and continuous Wayland touchpads.
- **Bus Text Clipping** — Uses `ctx.measureText()` in a shrink-loop to fit text inside diamond polygons, appending `..` when truncated.
- **Context Menu** — Globally suppressed (`contextmenu` event prevented) for a clean in-app right-click experience.

---

## 📜 License

This project is open source. Feel free to use, modify, and distribute.