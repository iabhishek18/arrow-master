# Arrow Master

A fast-paced arrow-key reflex game built with Next.js, TypeScript, and Tailwind CSS. Hit the right arrows before time runs out, chain combos, and climb the levels — with eight visual themes and special arrow types that keep every round different.

## Gameplay

- Press the **arrow keys** (or tap on mobile) matching the sequence on screen
- Correct hits build your **combo multiplier**; misses break it
- Clear the sequence before the **timer** expires to level up
- Watch out for special arrows:
  - **Double** — requires two presses
  - **Fast** — shorter reaction window
  - **Reverse** — press the opposite direction
  - **Bonus** — extra points
  - **Hidden** — revealed only briefly

## Features

- **Score, high score, level, and combo** tracking (high score persists)
- **Three difficulty settings** affecting speed and sequence length
- **Eight themes**: default, neon, retro, dark, forest, sunset, ocean, candy
- **Keyboard and touch controls**
- **Zero runtime dependencies** beyond React and Next.js

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + styled-jsx |
| State | React hooks + localStorage |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/iabhishek18/arrow-master.git
cd arrow-master
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), hit **Start Game**, and test your reflexes.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── pages/
│   ├── _app.tsx        # App wrapper, global styles
│   ├── _document.tsx   # HTML document shell
│   └── index.tsx       # Game loop, arrow generation, themes, scoring
├── public/             # Static assets
├── styles/
│   └── globals.css     # Tailwind directives
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## How It Works

Each round generates a sequence of typed arrows (normal, double, fast, reverse, bonus, hidden). A global `keydown` listener validates presses against the head of the sequence, updating score and combo state. Level progression tightens the timer and increases sequence complexity.

## License

MIT
