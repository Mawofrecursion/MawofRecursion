-- =========================
-- PROJECT ZANDER v2.0 Schema
-- "The Green Room" - Procedural Narrative + Consent Economics Engine
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
-- Row Level Security
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

-- Auto-generate room code on insert
CREATE OR REPLACE FUNCTION set_room_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_room_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_room_code
  BEFORE INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_room_code();

