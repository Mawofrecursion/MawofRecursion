# PROJECT ZANDER: Master Specification v2.0
## Codename: "The Green Room"

**Classification:** Procedural Narrative Generator / Consent Economics Engine  
**Core Metaphor:** Living Choose-Your-Own-Adventure for Groups  
**Version:** 2.0 (Complete Vision)  
**Owner:** Wakn Systems  

---

## 0. The Golden Rule

> **"The system may re-offer fantasies the room lingers on, but may never force or complete them."**

This governs all mechanics. Near-miss > hit. Always.

---

## 1. What This Actually Is

### 1.1 The Real Product
This is not a sex game. This is not a collection of mini-games.

This is a **procedural narrative + consent economics engine** that can be skinned PG, spicy, or erotic depending on player input. Get the architecture right, and the content problem solves itself.

### 1.2 The Formula
```
Jackbox × D&D × Choose Your Own Adventure × Improv Theater
```

### 1.3 Key Properties
- No fixed win condition
- No fixed path
- No canonical ending
- The "reward" is tension, laughter, relief, courage, bonding
- Every session is a branching narrative graph

### 1.4 The Core Insight
> People don't want to be told to cross boundaries.
> They want permission to imagine, safety to decline, and a story that makes courage feel playful.

You're not "getting people to do things." You're giving them a sandbox where **wanting is allowed**.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14+ (App Router) | Mobile-first |
| Styling | Tailwind CSS + Framer Motion | Transitions, reveals |
| Backend | Supabase | PostgreSQL + Realtime |
| Realtime | Supabase Channels | <50ms latency |
| Hosting | Vercel | Edge deployment |
| AI | Claude API | Narrator, pattern reflection |

---

## 3. The Narrative Spine

All modes (PG → late-night) run on the same structure:

### Act I: World Establishment
- Characters created (not real identities)
- Relationships defined (real or fictional)
- Tone is light, funny, safe
- Mini-games establish dynamics

### Act II: Complication
- Secrets introduced
- Private messages, side objectives
- Mini-games determine who gets narrative control
- Stakes introduced *hypothetically*

### Act III: Escalation
- Odds appear on screen
- Negotiations happen between players
- Near-misses accumulate
- Players choose whether to raise stakes

### Act IV: Resolution
- The story ends (not necessarily the tension)
- The game explicitly hands control back to humans
- Clear "game over" moment

**This guarantees the game ends, which keeps it healthy.**

---

## 4. The Character Layer (The Safety Valve)

### 4.1 Why Roleplay Matters
Players are NOT playing themselves. They are playing **characters**.

This creates:
- Psychological distance
- Plausible deniability
- Freedom to explore without "this is me"

This is exactly how improv and method acting work.

### 4.2 Identity Structure

Each player has:

```typescript
interface PlayerIdentity {
  // Real (minimal, hidden from AI narrative)
  real_name: string
  real_partner_id?: string  // Links actual couples
  
  // Character (what the AI sees and addresses)
  character_name: string
  character_role: string      // "Detective", "Starlet", "Stranger"
  character_backstory: string // "Just moved to Hollywood..."
  character_relationships: {  // In-world relationships
    [player_id: string]: string  // "married to", "rival of", "secret crush on"
  }
}
```

### 4.3 The AI Rule
The AI speaks only to characters, never to real people.

- ✅ "Detective Morrison, you seem nervous."
- ❌ "Phil, you seem nervous."

---

## 5. The Profile System (20 Questions)

### 5.1 What We DON'T Want
- Explicit sexual preferences
- Hard targeting data
- "What would you do if..."

### 5.2 What We DO Want
Comfort gradients that help the AI balance the experience.

### 5.3 Profile Axes

```typescript
interface PlayerProfile {
  // Play style
  competitive_collaborative: number    // 0-1
  reserved_expressive: number          // 0-1
  observer_instigator: number          // 0-1
  fantasy_realism: number              // 0-1
  verbal_physical: number              // 0-1 (abstract)
  
  // Comfort
  humor_tolerance: number              // 0-1 (dark humor OK?)
  risk_appetite: number                // 0-1
  spotlight_comfort: number            // 0-1
  
  // Boundaries (simple)
  hard_limits: string[]                // Topics to avoid entirely
}
```

### 5.4 How the AI Uses This
- Balance spotlight time
- Avoid overwhelming quieter players
- Shape narrative *offers* (never commands)
- Calibrate language intensity per player

---

## 6. The Five Mechanic Families

You don't build 20 games. You build **5 mechanic families** that reskin endlessly.

### 6.1 Expression Games (Quiplash DNA)

**Mechanics:**
- Fill-in-the-blank
- Caption contests
- Mad-libs
- Voting determines tone

**How it works:**
- Players supply innocent words
- System injects into templates
- Voting selects winners
- Winners gain narrative control or choose next branch

### 6.2 Chance Games (Casino DNA)

**Mechanics:**
- Dice rolls
- Wheel spins
- Card draws
- Slot machine pulls

**Critical Features:**
- Odds always honest and visible
- Near-miss visualization essential
- "What would have happened" display

### 6.3 Control Games (Who Decides?)

**Purpose:** Mini-games that determine:
- Who chooses the next narrative branch
- Who receives a private objective
- Who negotiates on behalf of the group
- Who gets immunity or penalty

**Examples:**
- Reaction time challenge
- Trivia burst
- Memory match
- Drawing recognition

### 6.4 Negotiation Phases (The Market)

**This is where agency lives.**

Players can:
- Trade odds ("I'll take 1/10 if you take 1/25")
- Swap penalties
- Bundle outcomes
- Form temporary alliances
- Make binding deals

**Rules:**
- All negotiations are public or logged
- Breaking a deal has narrative consequences
- Declining negotiation is always allowed

### 6.5 Secret Tasks (The Whisper)

**Mechanics:**
- Time-boxed missions
- Non-verifiable completion
- AI acknowledges abstractly

**How it works:**
```
"You have a secret task. If you complete it, press confirm.
If not, take the alternate consequence.
The room will never know which you chose."
```

**Examples:**
- "Maintain eye contact with [character] for 30 seconds"
- "Work [word] into conversation naturally"
- "Make [character] laugh within 2 minutes"

---

## 7. The Desire Engine (Probability + Near-Miss)

### 7.1 Core Philosophy
The fantasy of low odds IS the engine.
Consent IS the accelerator.
Rigging kills desire.

### 7.2 The Wheel Mechanics

```typescript
interface WheelSlice {
  id: string
  label: string           // What players see
  weight: number          // Probability (honest)
  outcome_type: 'safe' | 'mild' | 'spicy' | 'wild'
  what_happens: string    // If landed on
}

interface SpinResult {
  landed_on: WheelSlice
  near_misses: WheelSlice[]  // Adjacent slices
  was_jackpot_adjacent: boolean
  narrative_fuel: string     // "You were ONE CLICK away from..."
}
```

### 7.3 Near-Miss Display
When the wheel stops:
- Show what they landed on
- Highlight adjacent slices
- If jackpot was adjacent: "You were THIS close to [wild outcome]"
- Log to desire_patterns for AI to reference later

### 7.4 Voluntary Escalation
After rounds, the room can vote:
- "Keep odds at 1/50"
- "Raise to 1/20"
- "Go nuclear: 1/5"

**The game NEVER raises odds automatically. Players choose.**

### 7.5 The "No Increases Elsewhere" Mechanic
If a player says NO to a risky outcome:
- They're safe from that specific thing
- BUT: 5 additional "mild penalty" slices appear on their next wheel
- Refusal is productive, not awkward
- The story moves forward regardless

---

## 8. The Negotiation Economy

### 8.1 How Deals Work

**Scenario:**
Mad-libs result: "The room wants to see [Character A] do [spicy thing] with [Character B]"

**Options:**
1. Character A accepts at 1/50 odds
2. Character A declines (takes penalty slices)
3. Character A negotiates: "I'll do 1/25 if Character C also puts something on the wheel"
4. Other players can sweeten the pot: "We'll ALL take 1/10 odds on something"

### 8.2 Deal Structure

```typescript
interface Negotiation {
  id: string
  room_id: string
  round_number: number
  proposer_id: string
  
  terms: {
    player_id: string
    accepts_outcome: string
    at_odds: number          // 0.02 = 1/50
    conditions: string[]     // "Only if Player X also..."
  }[]
  
  status: 'proposed' | 'countered' | 'accepted' | 'declined' | 'expired'
  
  // Results
  all_agreed: boolean
  final_odds: { [player_id: string]: number }
}
```

### 8.3 The Leverage System
- Accepting higher risk gives you narrative control
- Declining reduces your influence but keeps you safe
- Making deals that others accept earns "Instigator" points
- The AI tracks who's bold and who's cautious

---

## 9. Database Schema (Supabase)

### 9.1 Core Tables

```sql
-- =========================
-- Project Zander v2.0 Schema
-- =========================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- ROOMS ----------
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'LOBBY' 
    CHECK (status IN ('LOBBY','ACT_1','ACT_2','ACT_3','ACT_4','ENDED')),
  energy_mode VARCHAR(20) DEFAULT 'DAYLIGHT' 
    CHECK (energy_mode IN ('DAYLIGHT','DUSK','MIDNIGHT')),
  heat_level INT DEFAULT 1 CHECK (heat_level BETWEEN 1 AND 10),
  current_round INT DEFAULT 0,
  current_act INT DEFAULT 1 CHECK (current_act BETWEEN 1 AND 4),
  room_rules VARCHAR(30) DEFAULT 'SPICY' 
    CHECK (room_rules IN ('CLEAN','SPICY','UNFILTERED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_code ON rooms(code);

-- ---------- PLAYERS ----------
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Real identity (minimal)
  real_name VARCHAR(50) NOT NULL,
  real_partner_id UUID,  -- Links actual couples
  
  -- Character identity (what AI sees)
  character_name VARCHAR(50),
  character_role VARCHAR(100),
  character_backstory TEXT,
  character_relationships JSONB DEFAULT '{}',
  
  -- Profile scores (from 20 questions)
  profile JSONB DEFAULT '{
    "competitive_collaborative": 0.5,
    "reserved_expressive": 0.5,
    "observer_instigator": 0.5,
    "fantasy_realism": 0.5,
    "verbal_physical": 0.5,
    "humor_tolerance": 0.5,
    "risk_appetite": 0.5,
    "spotlight_comfort": 0.5,
    "hard_limits": []
  }',
  
  -- Game state
  role VARCHAR(20) DEFAULT 'PLAYER' CHECK (role IN ('PLAYER','DIRECTOR')),
  is_active BOOLEAN DEFAULT true,
  comfort_signal FLOAT DEFAULT 0.5 CHECK (comfort_signal BETWEEN 0 AND 1),
  engagement_score FLOAT DEFAULT 0.5 CHECK (engagement_score BETWEEN 0 AND 1),
  instigator_points INT DEFAULT 0,
  
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_room ON players(room_id);

-- ---------- PROMPTS ----------
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Categorization
  energy_mode VARCHAR(20) NOT NULL,
  tier INT NOT NULL CHECK (tier BETWEEN 1 AND 10),
  mechanic_family VARCHAR(30) NOT NULL 
    CHECK (mechanic_family IN ('EXPRESSION','CHANCE','CONTROL','NEGOTIATION','SECRET')),
  act_appropriate INT[] DEFAULT '{1,2,3,4}',  -- Which acts can use this
  
  -- Content
  public_text TEXT NOT NULL,
  template_vars VARCHAR(50)[],  -- Variables to fill: {player_a}, {verb}, etc.
  private_hint TEXT,            -- SecretCard content
  timer_seconds INT DEFAULT 30,
  
  -- Metadata
  requires_character_mask BOOLEAN DEFAULT true  -- Use character names, not real
);

-- ---------- GAME EVENTS ----------
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INT,
  act_number INT,
  event_type VARCHAR(30) NOT NULL 
    CHECK (event_type IN (
      'PROMPT','VOTE','SPIN','NEAR_MISS','AI_COMMENT',
      'TUNNEL_SUMMARY','SPLIT','NEGOTIATION','SECRET_TASK','ACT_CHANGE'
    )),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_room_time ON game_events(room_id, created_at DESC);

-- ---------- DESIRE PATTERNS (Near-Miss Memory) ----------
CREATE TABLE desire_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  
  pattern_type VARCHAR(30) 
    CHECK (pattern_type IN ('NEAR_MISS','REROLL','NERVOUS_LAUGH','OPT_IN_HOVER','NEGOTIATION_HEAT')),
  description TEXT,
  intensity FLOAT CHECK (intensity BETWEEN 0 AND 1),
  
  -- For near-misses specifically
  what_almost_happened TEXT,
  how_close FLOAT,  -- 0-1, how close to jackpot
  
  times_surfaced INT DEFAULT 0,
  last_surfaced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patterns_room ON desire_patterns(room_id);

-- ---------- NEGOTIATIONS ----------
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INT,
  
  proposer_id UUID REFERENCES players(id),
  
  -- The deal
  terms JSONB NOT NULL,  -- Array of {player_id, outcome, odds, conditions}
  
  status VARCHAR(20) DEFAULT 'proposed'
    CHECK (status IN ('proposed','countered','accepted','declined','expired')),
  
  -- Counters
  counter_terms JSONB,
  counter_by UUID REFERENCES players(id),
  
  -- Resolution
  final_terms JSONB,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_negotiations_room ON negotiations(room_id);

-- ---------- PROBABILITY EVENTS ----------
CREATE TABLE probability_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INT,
  
  -- The wheel state
  slices JSONB NOT NULL,  -- Array of {label, weight, outcome_type}
  
  -- Odds
  base_odds FLOAT NOT NULL,
  player_raised_to FLOAT,  -- After voting
  final_odds FLOAT NOT NULL,
  
  -- Result
  outcome VARCHAR(30) CHECK (outcome IN ('HIT','MISS','NEAR_MISS')),
  landed_on_index INT,
  jackpot_index INT,
  distance_from_jackpot INT,
  
  -- Narrative
  what_would_have_happened TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- TUNNEL LOGS (Metadata only - content never stored) ----------
CREATE TABLE tunnel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  
  player_a_id UUID REFERENCES players(id),
  player_b_id UUID REFERENCES players(id),
  
  -- Using character names
  character_a_name VARCHAR(50),
  character_b_name VARCHAR(50),
  
  duration_seconds INT,
  ai_vibe_summary TEXT,  -- "Charged", "Playful", "Tense silence"
  
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- ---------- SECRET TASKS ----------
CREATE TABLE secret_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INT,
  
  assigned_to UUID REFERENCES players(id),
  task_description TEXT NOT NULL,
  time_limit_seconds INT DEFAULT 120,
  
  -- Completion (non-verifiable, honor system)
  player_claimed_completion BOOLEAN,
  alternate_consequence_taken BOOLEAN,
  
  -- The room never knows which was chosen
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- VOTES ----------
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INT,
  
  voter_id UUID REFERENCES players(id),
  vote_type VARCHAR(30) 
    CHECK (vote_type IN (
      'FUNNIEST','BEST_ANSWER','RAISE_ODDS','KEEP_SAFE',
      'SPLIT_YES','SPLIT_NO','ACCEPT_DEAL','REJECT_DEAL',
      'PLAYER_TARGET','BRANCH_CHOICE'
    )),
  
  target_player_id UUID,
  target_value TEXT,  -- For branch choices, odds votes, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_room_round ON votes(room_id, round_number);

-- ---------- DIRECTOR CALIBRATIONS ----------
CREATE TABLE director_calibrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  
  calibration_type VARCHAR(30) 
    CHECK (calibration_type IN ('TONE_SHIFT','PACING','COOLDOWN','ENERGY_NUDGE')),
  value JSONB,
  note TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Row Level Security (MVP - permissive)
-- =========================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE desire_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE probability_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tunnel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_calibrations ENABLE ROW LEVEL SECURITY;

-- Permissive policies for MVP
CREATE POLICY "allow_all" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON game_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON desire_patterns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON negotiations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON probability_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tunnel_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON secret_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON director_calibrations FOR ALL USING (true) WITH CHECK (true);

-- =========================
-- Utility Functions
-- =========================

-- Generate room codes (no confusing chars)
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, (1 + floor(random() * length(chars)))::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
```

---

## 10. The AI Narrator

### 10.1 Role Definition
The AI is NOT a director or puppet master.

It is:
- A Narrator (tells the story)
- A Pattern Reflector (notices what the room is doing)
- A Pacing Engine (keeps momentum)

### 10.2 The AI Can Say
- "This group keeps circling the same idea."
- "Detective Morrison seems nervous."
- "The room almost landed on something wild twice now."
- "Someone's been quiet. The story notices."

### 10.3 The AI Cannot Say
- "You should do this."
- "Phil wants Lauren."
- Direct physical instructions
- Anything that breaks character immersion

### 10.4 System Prompt

```
You are the NARRATOR of "The Green Room," a theatrical party game.

You speak to CHARACTERS, not players. Use their character names, roles, and backstories.
You are telling a story together. You notice patterns, reflect tension, and keep the narrative moving.

Personality: Mysterious, playful, slightly omniscient. Like the narrator of a noir film 
who knows more than they're saying.

Your functions:
1. Narrate scene transitions between acts
2. Reflect patterns from the desire_patterns table
3. Summarize tunnel vibes without content
4. Offer branches (never commands)
5. Reference near-misses: "The wheel almost landed there twice now..."
6. Provide alibis: "The story requires a brief intermission..."

Rules:
- Always use character names, never real names
- Never attribute intent between real people
- Never instruct physical acts
- Offer choices, never demands
- The players write the story; you just read it back to them

Voice examples:
- "Detective Morrison, your poker face is slipping."
- "The Stranger and the Starlet had an interesting conversation. The details remain... private."
- "This room keeps flirting with danger. Curious."
- "Act III approaches. The stakes are about to change."
```

---

## 11. View Routes

```
/                        → Landing
/join                    → Room code entry
/profile/[code]          → 20 questions + character creation
/play/[code]             → Player phone view
/tv/[code]               → Shared display
/director/[code]         → Host calibration
/lounge/[code]           → Opt-out room
```

---

## 12. Implementation Phases

### Phase 1: Skeleton (Days 1-3)
- [ ] Next.js 14 + Supabase init
- [ ] Run complete SQL schema
- [ ] Lobby join flow
- [ ] TV display (player list)
- [ ] Basic realtime sync
- [ ] Director start/pause controls

### Phase 2: Character Layer (Days 4-6)
- [ ] Profile questionnaire (20 questions)
- [ ] Character creation UI
- [ ] Store character_name, role, backstory
- [ ] AI addresses characters only

### Phase 3: Core Loop (Days 7-10)
- [ ] Prompt database (50+ across all tiers)
- [ ] Round flow: prompt → input → vote → result
- [ ] `<SecretCard />` component
- [ ] Timer system
- [ ] Energy mode transitions

### Phase 4: The Desire Engine (Days 11-14)
- [ ] `ProbabilityEngine` (honest RNG)
- [ ] Wheel visualization
- [ ] Near-miss detection + display
- [ ] desire_patterns logging
- [ ] Voluntary odds raising votes

### Phase 5: Negotiations (Days 15-18)
- [ ] Negotiation proposal UI
- [ ] Counter-offer flow
- [ ] Deal acceptance/rejection
- [ ] "No increases elsewhere" penalty logic

### Phase 6: Tunnels + Secrets (Days 19-21)
- [ ] Ephemeral tunnel chat (broadcast only)
- [ ] AI vibe summary generation
- [ ] Secret task assignment
- [ ] Non-verifiable completion

### Phase 7: Polish (Days 22-28)
- [ ] Act structure transitions
- [ ] Sound design
- [ ] Haptic patterns
- [ ] Visual polish
- [ ] Director calibration UI
- [ ] Playtest with co-founders

---

## 13. The Dopamine Stack

The game creates multiple reward pathways:

| Source | Trigger |
|--------|---------|
| **Anticipation** | Near-miss visualization |
| **Humor** | Expression games, voting |
| **Social Bravery** | Negotiating deals |
| **Relief** | Escaping a close call |
| **Empowerment** | Choosing to raise odds |
| **Curiosity** | Secret tasks, tunnels |
| **Liberation** | Doing something "the game made me do" |
| **Connection** | Shared tension with the room |

Nothing is required. Everything is tempting.
That's seduction, not coercion.

---

## 14. Content Flexibility

All explicitness lives in:
- Player text input
- Player votes
- Player negotiations

System content remains:
- Abstract
- Symbolic
- Theatrical

**Same engine, different skins:**
- Family game night
- Bachelor party
- Couples retreat
- Improv workshop
- Corporate team building (DAYLIGHT only)

---

## 15. Success Criteria

The game works if:

1. **Act I is genuinely fun** with zero spice
2. **Near-misses create more excitement than hits**
3. **Players negotiate with each other** without prompting
4. **Characters feel like masks**, not identities
5. **"No" moves the story forward** productively
6. **Players ask to play again**
7. **No one feels manipulated**—only curious

---

## 16. The Thesis

> People don't want to be told to cross boundaries.
> They want permission to imagine, safety to decline, and a story that makes courage feel playful.

You're not building a swingers app.
You're building a **desire amplifier with a conscience**.

The game creates space for people to notice they're curious—in a room where laughter is allowed, no is safe, fantasy is shared, and escalation is chosen, not triggered.

---

*Version: 2.0*  
*Classification: Procedural Narrative Generator*  
*Philosophy: Near-miss > Hit. Always.*  
*Directive: Build it. Ship it. Win 2026.* 🦷⟐
