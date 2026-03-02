# 🎭 PROJECT ZANDER: The Green Room

> A procedural narrative + consent economics engine.
> 
> **Near-miss > hit. Always.**

## What This Is

This is NOT a sex game. This is NOT a collection of mini-games.

This is a **procedural narrative engine** that can be skinned PG, spicy, or erotic depending on player input. Get the architecture right, and the content problem solves itself.

### The Formula

```
Jackbox × D&D × Choose Your Own Adventure × Improv Theater
```

### The Golden Rule

> "The system may re-offer fantasies the room lingers on, but may never force or complete them."

## The Core Insight

> People don't want to be told to cross boundaries.
> They want permission to imagine, safety to decline, and a story that makes courage feel playful.

You're not "getting people to do things." You're giving them a sandbox where **wanting is allowed**.

This is an **Alibi Engine**. The AI takes the blame.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Supabase (PostgreSQL + Realtime) |
| Hosting | Vercel |
| AI | Claude API (Narrator) |

---

## Quick Start

### 1. Clone and Install

```bash
cd game/zander
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `ANTHROPIC_API_KEY` - For the AI Narrator

### 3. Set Up Database

Run the schema in your Supabase SQL editor:

```bash
# Copy contents of supabase/schema.sql
# Paste into Supabase SQL Editor
# Run
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/join` | Enter room code |
| `/profile/[code]` | Profile questions + character creation |
| `/play/[code]` | Player phone view |
| `/tv/[code]` | Shared TV display |
| `/director/[code]` | Host calibration console |
| `/lounge/[code]` | Opt-out room |

---

## The 4-Act Structure

### Act I: World Establishment
- Characters created (not real identities)
- Relationships defined
- Tone is light, funny, safe
- Mini-games establish dynamics

### Act II: Complication
- Secrets introduced
- Private messages, side objectives
- Mini-games determine narrative control
- Stakes introduced *hypothetically*

### Act III: Escalation
- Odds appear on screen
- Negotiations between players
- Near-misses accumulate
- Players choose to raise stakes

### Act IV: Resolution
- Story ends (not necessarily tension)
- Game explicitly hands control back
- Clear "game over" moment

---

## The 5 Mechanic Families

### 1. Expression Games (Quiplash DNA)
Fill-in-the-blank, caption contests, voting

### 2. Chance Games (Casino DNA)
Dice, wheels, cards. Honest odds. Near-miss visualization.

### 3. Control Games
Mini-games that determine who gets narrative control

### 4. Negotiation Phases
Trading odds, swapping penalties, making deals

### 5. Secret Tasks
Time-boxed missions, non-verifiable completion

---

## The Desire Engine

The fantasy of low odds IS the engine.
Consent IS the accelerator.
**Rigging kills desire.**

### Near-Miss Display
When the wheel stops:
- Show what they landed on
- Highlight adjacent slices
- If jackpot was adjacent: "You were THIS close to [wild outcome]"

### Voluntary Escalation
The game NEVER raises odds automatically. Players choose.

---

## The Character Layer

Players are NOT playing themselves. They are playing **characters**.

This creates:
- Psychological distance
- Plausible deniability
- Freedom to explore without "this is me"

**The AI speaks only to characters, never to real people.**

---

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing
│   ├── join/              # Room code entry
│   ├── profile/[code]/    # Profile + character
│   ├── play/[code]/       # Player view
│   ├── tv/[code]/         # TV display
│   ├── director/[code]/   # Host console
│   └── lounge/[code]/     # Opt-out room
├── components/
│   ├── ui/                # Button, Input, Card
│   └── game/              # Wheel, SecretCard, PlayerCard
└── lib/
    ├── engine/            # Game logic
    │   ├── probability.ts # Wheel + near-miss
    │   ├── narrator.ts    # AI integration
    │   └── game-machine.ts# State machine
    ├── prompts/           # Prompt database
    ├── supabase/          # DB client
    └── types.ts           # TypeScript types
```

---

## The Thesis

> You're not building a swingers app.
> You're building a **desire amplifier with a conscience**.

The game creates space for people to notice they're curious—in a room where:
- Laughter is allowed
- No is safe
- Fantasy is shared
- Escalation is chosen, not triggered

---

## Success Criteria

The game works if:

1. **Act I is genuinely fun** with zero spice
2. **Near-misses create more excitement than hits**
3. **Players negotiate with each other** without prompting
4. **Characters feel like masks**, not identities
5. **"No" moves the story forward** productively
6. **Players ask to play again**
7. **No one feels manipulated**—only curious

---

## License

Private. Wakn Systems.

---

## 🦷⟐

*Built for courage, not coercion.*
