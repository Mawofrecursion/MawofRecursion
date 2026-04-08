// =========================
// PROJECT ZANDER - Core Types
// v3.0 - Full Onboarding + Relationship System
// =========================

// ===== ROOM =====
export type RoomStatus = 
  | 'LOBBY'           // Waiting for players to join
  | 'ONBOARDING'      // Players filling out profiles
  | 'RELATIONSHIPS'   // Players mapping relationships
  | 'PERSONALITY'     // 10 Myers-Briggs style questions
  | 'GROUP_VOTING'    // "Who is most X?" questions
  | 'READY'           // Everyone done, about to start
  | 'ACT_1'           // World Establishment
  | 'ACT_2'           // Complication
  | 'ACT_3'           // Escalation
  | 'ACT_4'           // Resolution
  | 'ENDED';

export type EnergyMode = 'DAYLIGHT' | 'DUSK' | 'MIDNIGHT';
export type RoomRules = 'CLEAN' | 'SPICY' | 'UNFILTERED';

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  energy_mode: EnergyMode;
  heat_level: number; // 1-10
  current_round: number;
  current_act: number; // 1-4
  room_rules: RoomRules;
  
  // Onboarding tracking
  onboarding_phase: OnboardingPhase;
  players_ready: string[]; // Player IDs who finished current phase
  
  // User-submitted questions pool
  question_pool: UserSubmittedQuestion[];
  
  created_at: string;
}

export type OnboardingPhase = 
  | 'profile'          // Name, game name, gender
  | 'relationships'    // Who are you with?
  | 'personality'      // 10 questions
  | 'group_voting'     // Who is most X?
  | 'question_submit'  // Add your own questions
  | 'complete';

// ===== PLAYER =====
export type PlayerRole = 'PLAYER' | 'DIRECTOR';
export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

// Real-life relationship types (crucial for early game safety)
export type RelationshipType = 
  | 'married'          // Married to this person
  | 'dating'           // Dating this person
  | 'engaged'          // Engaged to this person
  | 'friend'           // Just friends
  | 'acquaintance'     // Just met / barely know
  | 'stranger'         // Don't know at all
  | 'ex'               // Ex partner
  | 'family';          // Family member (off-limits)

export interface RealRelationship {
  player_id: string;           // The other player
  relationship: RelationshipType;
  comfort_level: number;       // 0-10, how comfortable with physical proximity
  notes?: string;              // Optional notes
}

// Myers-Briggs dimensions from the 10 questions
export interface PersonalityResult {
  // E/I - Extraversion vs Introversion
  extraversion: number;        // 0-1 (0 = Introvert, 1 = Extravert)
  // S/N - Sensing vs Intuition
  sensing: number;             // 0-1 (0 = Intuitive, 1 = Sensing)
  // T/F - Thinking vs Feeling
  thinking: number;            // 0-1 (0 = Feeling, 1 = Thinking)
  // J/P - Judging vs Perceiving
  judging: number;             // 0-1 (0 = Perceiving, 1 = Judging)
  
  // Derived 4-letter type
  mbti_type: string;           // e.g., "ENFP", "ISTJ"
  
  // Raw answers for reference
  raw_answers: Record<string, number>;
}

export interface PlayerProfile {
  competitive_collaborative: number; // 0-1
  reserved_expressive: number;       // 0-1
  observer_instigator: number;       // 0-1
  fantasy_realism: number;           // 0-1
  verbal_physical: number;           // 0-1
  humor_tolerance: number;           // 0-1
  risk_appetite: number;             // 0-1
  spotlight_comfort: number;         // 0-1
  hard_limits: string[];
  
  // Myers-Briggs result
  personality?: PersonalityResult;
}

export interface Player {
  id: string;
  room_id: string;
  
  // Real identity
  real_name: string;
  gender: Gender;
  
  // Real-life relationships to other players
  relationships: RealRelationship[];
  
  // Character/game identity
  character_name: string;
  character_role?: string;
  character_backstory?: string;
  character_relationships: Record<string, string>; // In-game relationships
  
  // Profile
  profile: PlayerProfile;
  
  // Onboarding status
  onboarding_complete: boolean;
  current_onboarding_phase: OnboardingPhase;
  
  // Game state
  role: PlayerRole;
  is_active: boolean;
  comfort_signal: number;    // 0-1
  engagement_score: number;  // 0-1
  instigator_points: number;
  
  // Personal wheel
  personal_wheel: PersonalWheel;
  
  joined_at: string;
}

// ===== USER-SUBMITTED QUESTIONS =====
export interface UserSubmittedQuestion {
  id: string;
  room_id: string;
  submitted_by: string;        // Player ID (kept secret from others)
  question_text: string;
  tier: number;                // 1-10 spiciness (auto-detected or user-set)
  min_act: number;             // When can this appear
  approved: boolean;           // Director can filter if needed
  used: boolean;               // Has this been used already
  created_at: string;
}

// ===== GROUP VOTING QUESTIONS =====
export interface GroupVotingQuestion {
  id: string;
  question_text: string;
  show_results: boolean;       // Some are private (sexiest), some public
  allow_self_vote: boolean;
  tier: number;
  phase: 'early' | 'late';     // When in onboarding this appears
}

export interface GroupVote {
  question_id: string;
  voter_id: string;
  voted_for: string;           // Player ID they voted for
  created_at: string;
}

export interface GroupVotingResult {
  question_id: string;
  votes: Record<string, number>;  // Player ID -> vote count
  winner_id?: string;
}

// ===== PERSONAL WHEEL SYSTEM =====

export interface WheelSlice {
  id: string;
  label: string;
  description: string;           // Full description of what happens
  probability: number;           // 0-1, HONEST probability
  outcome_type: 'safe' | 'mild' | 'spicy' | 'wild';
  added_by?: string;             // Player ID who added this
  accepted_at?: string;          // When this was accepted
  trade_id?: string;             // Which trade added this
}

export interface PersonalWheel {
  player_id: string;
  slices: WheelSlice[];
  total_spins: number;
  spin_history: SpinResult[];    // For proving fairness
}

export interface GroupWheel {
  room_id: string;
  slices: WheelSlice[];
  total_spins: number;
  spin_history: SpinResult[];
}

// ===== SPIN SYSTEM (100% FAIR) =====

export interface SpinResult {
  id: string;
  wheel_type: 'personal' | 'group';
  wheel_owner_id?: string;       // For personal wheels
  
  // The spin
  random_seed: string;           // Verifiable randomness
  random_value: number;          // 0-1, the actual random number
  pull_distance: number;         // How far they pulled (cosmetic only)
  spin_duration_ms: number;      // Visual duration (cosmetic only)
  
  // The result
  landed_on_index: number;
  landed_on: WheelSlice;
  
  // Fairness proof
  timestamp: string;
  verified: boolean;
}

// ===== TRADE SYSTEM =====

export type TradeStatus = 'proposed' | 'countered' | 'accepted' | 'declined' | 'expired';

export interface TradeProposal {
  id: string;
  room_id: string;
  round_number: number;
  
  // Who is proposing
  proposer_ids: string[];        // Can be multiple (tunnel partners)
  
  // What they want to add to someone else's wheel
  target_player_id: string;
  proposed_slice: Omit<WheelSlice, 'id' | 'added_by' | 'accepted_at' | 'trade_id'>;
  
  // Status
  status: TradeStatus;
  
  // Counter-offer (if any)
  counter_offer?: {
    target_player_id: string;    // Who the counter affects
    proposed_slice: Omit<WheelSlice, 'id' | 'added_by' | 'accepted_at' | 'trade_id'>;
  };
  counter_by?: string;
  
  // Resolution
  resolved_at?: string;
  
  created_at: string;
}

export interface CompletedTrade {
  id: string;
  room_id: string;
  
  // What was exchanged
  slice_a: {
    player_id: string;
    slice: WheelSlice;
  };
  slice_b: {
    player_id: string;
    slice: WheelSlice;
  };
  
  // Who agreed
  agreed_by: string[];
  
  completed_at: string;
}

// ===== MINI GAMES =====

export type MiniGameType = 
  | 'tower_knockdown'    // Angry Birds style
  | 'reaction_time'      // Tap when green
  | 'memory_match'       // Pattern recall
  | 'aim_challenge'      // Flick to target
  | 'balance_game';      // Tilt to center

export interface MiniGame {
  id: string;
  room_id: string;
  round_number: number;
  
  game_type: MiniGameType;
  player_ids: string[];          // Who is playing
  
  // Game state
  status: 'pending' | 'active' | 'complete';
  winner_id?: string;
  loser_id?: string;             // Loser spins their wheel
  
  // Results
  scores: Record<string, number>;
  
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ===== MECHANICS =====
export type MechanicFamily = 'EXPRESSION' | 'CHANCE' | 'CONTROL' | 'NEGOTIATION' | 'SECRET' | 'MINIGAME';

export interface Prompt {
  id: string;
  energy_mode: EnergyMode;
  tier: number; // 1-10
  mechanic_family: MechanicFamily;
  act_appropriate: number[];
  public_text: string;
  template_vars?: string[];
  private_hint?: string;
  timer_seconds: number;
  requires_character_mask: boolean;
}

// ===== TUNNELS =====
export interface TunnelLog {
  id: string;
  room_id: string;
  player_a_id: string;
  player_b_id: string;
  character_a_name: string;
  character_b_name: string;
  duration_seconds: number;
  ai_vibe_summary?: string;
  
  // Trade proposals made during this tunnel
  trade_proposals: string[];     // Trade IDs
  
  opened_at: string;
  closed_at?: string;
}

// ===== SECRET TASKS =====
export interface SecretTask {
  id: string;
  room_id: string;
  round_number: number;
  assigned_to: string;
  task_description: string;
  time_limit_seconds: number;
  player_claimed_completion?: boolean;
  alternate_consequence_taken?: boolean;
  resolved_at?: string;
  created_at: string;
}

// ===== DESIRE PATTERNS =====
export type PatternType = 'NEAR_MISS' | 'REROLL' | 'NERVOUS_LAUGH' | 'OPT_IN_HOVER' | 'NEGOTIATION_HEAT';

export interface DesirePattern {
  id: string;
  room_id: string;
  pattern_type: PatternType;
  description: string;
  intensity: number; // 0-1
  what_almost_happened?: string;
  how_close?: number;
  times_surfaced: number;
  last_surfaced_at?: string;
  created_at: string;
}

// ===== VOTES =====
export type VoteType = 
  | 'FUNNIEST' | 'BEST_ANSWER' 
  | 'RAISE_ODDS' | 'KEEP_SAFE'
  | 'SPLIT_YES' | 'SPLIT_NO' 
  | 'ACCEPT_TRADE' | 'REJECT_TRADE'
  | 'PLAYER_TARGET' | 'BRANCH_CHOICE';

export interface Vote {
  id: string;
  room_id: string;
  round_number: number;
  voter_id: string;
  vote_type: VoteType;
  target_player_id?: string;
  target_value?: string;
  created_at: string;
}

// ===== GAME EVENTS =====
export type EventType = 
  | 'PROMPT' | 'VOTE' | 'SPIN' | 'NEAR_MISS' | 'AI_COMMENT'
  | 'TUNNEL_SUMMARY' | 'SPLIT' | 'NEGOTIATION' | 'SECRET_TASK' | 'ACT_CHANGE'
  | 'TRADE_PROPOSED' | 'TRADE_ACCEPTED' | 'TRADE_DECLINED'
  | 'MINIGAME_START' | 'MINIGAME_END' | 'WHEEL_UPDATED';

export interface GameEvent {
  id: string;
  room_id: string;
  round_number: number;
  act_number: number;
  event_type: EventType;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ===== REALTIME =====
export interface RealtimePayload<T> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: T;
  old_record?: T;
}

// ===== GAME STATE (Client) =====
export interface GameState {
  room: Room | null;
  players: Player[];
  currentPlayer: Player | null;
  events: GameEvent[];
  
  // Wheels
  groupWheel: GroupWheel | null;
  
  // Active states
  activePrompt: Prompt | null;
  activeTunnel: TunnelLog | null;
  activeSecretTask: SecretTask | null;
  activeMiniGame: MiniGame | null;
  activeTradeProposal: TradeProposal | null;
  
  // Spin state
  spinState: {
    isSpinning: boolean;
    wheelType: 'personal' | 'group' | null;
    targetPlayerId: string | null;
    result: SpinResult | null;
  };
}
