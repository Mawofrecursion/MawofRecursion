// =========================
// MOCK DATA
// For development and testing
// =========================

import type { Player, Room, PersonalWheel, Gender, RealRelationship } from './types';
import { createDefaultPersonalWheel } from './engine/fair-spin';

// Helper to create a mock personal wheel
function createMockWheel(playerId: string): PersonalWheel {
  return createDefaultPersonalWheel(playerId);
}

// Default profile
const DEFAULT_PROFILE = {
  competitive_collaborative: 0.5,
  reserved_expressive: 0.5,
  observer_instigator: 0.5,
  fantasy_realism: 0.5,
  verbal_physical: 0.5,
  humor_tolerance: 0.5,
  risk_appetite: 0.5,
  spotlight_comfort: 0.5,
  hard_limits: [] as string[],
};

// Phil's relationships (married to Liz)
const PHIL_RELATIONSHIPS: RealRelationship[] = [
  { player_id: '2', relationship: 'friend', comfort_level: 7 },       // Lauren
  { player_id: '3', relationship: 'friend', comfort_level: 7 },       // Mike
  { player_id: '4', relationship: 'married', comfort_level: 10 },     // Liz
];

// Liz's relationships (married to Phil)
const LIZ_RELATIONSHIPS: RealRelationship[] = [
  { player_id: '1', relationship: 'married', comfort_level: 10 },     // Phil
  { player_id: '2', relationship: 'friend', comfort_level: 8 },       // Lauren
  { player_id: '3', relationship: 'friend', comfort_level: 6 },       // Mike
];

// Mike's relationships (married to Lauren)
const MIKE_RELATIONSHIPS: RealRelationship[] = [
  { player_id: '1', relationship: 'friend', comfort_level: 7 },       // Phil
  { player_id: '2', relationship: 'married', comfort_level: 10 },     // Lauren
  { player_id: '4', relationship: 'friend', comfort_level: 6 },       // Liz
];

// Lauren's relationships (married to Mike)
const LAUREN_RELATIONSHIPS: RealRelationship[] = [
  { player_id: '1', relationship: 'friend', comfort_level: 7 },       // Phil
  { player_id: '3', relationship: 'married', comfort_level: 10 },     // Mike
  { player_id: '4', relationship: 'friend', comfort_level: 8 },       // Liz
];

export const MOCK_ROOM: Room = {
  id: '1',
  code: 'ABCD12',
  status: 'ACT_2',
  energy_mode: 'DUSK',
  heat_level: 5,
  current_round: 4,
  current_act: 2,
  room_rules: 'SPICY',
  onboarding_phase: 'complete',
  players_ready: ['1', '2', '3', '4'],
  question_pool: [],
  created_at: new Date().toISOString(),
};

export const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    room_id: '1',
    real_name: 'Phil',
    gender: 'male',
    relationships: PHIL_RELATIONSHIPS,
    character_name: 'Detective Morrison',
    character_role: 'The Detective',
    character_relationships: {},
    profile: { ...DEFAULT_PROFILE, risk_appetite: 0.7, observer_instigator: 0.8 },
    onboarding_complete: true,
    current_onboarding_phase: 'complete',
    role: 'DIRECTOR',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.8,
    instigator_points: 3,
    personal_wheel: createMockWheel('1'),
    joined_at: new Date().toISOString(),
  },
  {
    id: '2',
    room_id: '1',
    real_name: 'Lauren',
    gender: 'female',
    relationships: LAUREN_RELATIONSHIPS,
    character_name: 'The Starlet',
    character_role: 'The Starlet',
    character_relationships: {},
    profile: { ...DEFAULT_PROFILE, reserved_expressive: 0.8, spotlight_comfort: 0.9 },
    onboarding_complete: true,
    current_onboarding_phase: 'complete',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.9,
    instigator_points: 5,
    personal_wheel: createMockWheel('2'),
    joined_at: new Date().toISOString(),
  },
  {
    id: '3',
    room_id: '1',
    real_name: 'Mike',
    gender: 'male',
    relationships: MIKE_RELATIONSHIPS,
    character_name: 'The Stranger',
    character_role: 'The Stranger',
    character_relationships: {},
    profile: { ...DEFAULT_PROFILE },
    onboarding_complete: true,
    current_onboarding_phase: 'complete',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.7,
    instigator_points: 2,
    personal_wheel: createMockWheel('3'),
    joined_at: new Date().toISOString(),
  },
  {
    id: '4',
    room_id: '1',
    real_name: 'Liz',
    gender: 'female',
    relationships: LIZ_RELATIONSHIPS,
    character_name: 'The Voyeur',
    character_role: 'The Voyeur',
    character_relationships: {},
    profile: { ...DEFAULT_PROFILE, observer_instigator: 0.2 },
    onboarding_complete: true,
    current_onboarding_phase: 'complete',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.6,
    instigator_points: 1,
    personal_wheel: createMockWheel('4'),
    joined_at: new Date().toISOString(),
  },
];

// Subset for lounge (players who opted out)
export const MOCK_LOUNGE_PLAYERS: Player[] = [
  MOCK_PLAYERS[3], // Liz
  {
    id: '5',
    room_id: '1',
    real_name: 'Jordan',
    gender: 'non-binary',
    relationships: [],
    character_name: 'The Mystic',
    character_role: 'The Mystic',
    character_relationships: {},
    profile: { ...DEFAULT_PROFILE, fantasy_realism: 0.9 },
    onboarding_complete: true,
    current_onboarding_phase: 'complete',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.5,
    instigator_points: 0,
    personal_wheel: createMockWheel('5'),
    joined_at: new Date().toISOString(),
  },
];

// Get a player by ID
export function getMockPlayer(id: string): Player | undefined {
  return [...MOCK_PLAYERS, ...MOCK_LOUNGE_PLAYERS].find(p => p.id === id);
}

// Create a new mock player
export function createMockPlayer(
  id: string,
  realName: string,
  characterName: string,
  characterRole: string,
  gender: Gender = 'prefer-not-to-say',
  isDirector: boolean = false
): Player {
  return {
    id,
    room_id: '1',
    real_name: realName,
    gender,
    relationships: [],
    character_name: characterName,
    character_role: characterRole,
    character_relationships: {},
    profile: { ...DEFAULT_PROFILE },
    onboarding_complete: false,
    current_onboarding_phase: 'profile',
    role: isDirector ? 'DIRECTOR' : 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.5,
    instigator_points: 0,
    personal_wheel: createMockWheel(id),
    joined_at: new Date().toISOString(),
  };
}

// Helper to check if two players are in a romantic relationship
export function arePartnered(player1: Player, player2: Player): boolean {
  const rel = player1.relationships.find(r => r.player_id === player2.id);
  return rel?.relationship === 'married' || rel?.relationship === 'dating' || rel?.relationship === 'engaged';
}

// Helper to get partner(s) for a player
export function getPartners(player: Player, allPlayers: Player[]): Player[] {
  return player.relationships
    .filter(r => ['married', 'dating', 'engaged'].includes(r.relationship))
    .map(r => allPlayers.find(p => p.id === r.player_id))
    .filter((p): p is Player => p !== undefined);
}

