// =========================
// GAME STATE MACHINE
// The 4-Act Narrative Structure
// =========================

import type { Room, RoomStatus, Player, GameEvent, EnergyMode } from '../types';

// ===== ACT DEFINITIONS =====

export interface ActConfig {
  name: string;
  description: string;
  minRounds: number;
  maxRounds: number;
  allowedMechanics: string[];
  minTier: number;
  maxTier: number;
  canEscalate: boolean;
  canSplit: boolean;
}

export const ACTS: Record<RoomStatus, ActConfig | null> = {
  LOBBY: null,
  
  ACT_1: {
    name: 'World Establishment',
    description: 'Characters created. Relationships defined. Tone is light, funny, safe.',
    minRounds: 3,
    maxRounds: 6,
    allowedMechanics: ['EXPRESSION', 'CONTROL'],
    minTier: 1,
    maxTier: 3,
    canEscalate: false,
    canSplit: false,
  },
  
  ACT_2: {
    name: 'Complication',
    description: 'Secrets introduced. Private messages. Stakes appear hypothetically.',
    minRounds: 4,
    maxRounds: 8,
    allowedMechanics: ['EXPRESSION', 'CHANCE', 'CONTROL', 'SECRET'],
    minTier: 2,
    maxTier: 5,
    canEscalate: false,
    canSplit: false,
  },
  
  ACT_3: {
    name: 'Escalation',
    description: 'Odds on screen. Negotiations. Near-misses accumulate. Players choose to raise stakes.',
    minRounds: 3,
    maxRounds: 10,
    allowedMechanics: ['EXPRESSION', 'CHANCE', 'CONTROL', 'NEGOTIATION', 'SECRET'],
    minTier: 3,
    maxTier: 8,
    canEscalate: true,
    canSplit: true,
  },
  
  ACT_4: {
    name: 'Resolution',
    description: 'The story ends. Control handed back to humans. Clear "game over" moment.',
    minRounds: 2,
    maxRounds: 4,
    allowedMechanics: ['EXPRESSION', 'CHANCE'],
    minTier: 1,
    maxTier: 10,
    canEscalate: true,
    canSplit: false,
  },
  
  ENDED: null,
};

// ===== STATE TRANSITIONS =====

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
  newStatus?: RoomStatus;
}

export function canTransitionTo(
  room: Room,
  targetStatus: RoomStatus
): TransitionResult {
  const validTransitions: Record<RoomStatus, RoomStatus[]> = {
    LOBBY: ['ACT_1'],
    ACT_1: ['ACT_2', 'ENDED'],
    ACT_2: ['ACT_3', 'ENDED'],
    ACT_3: ['ACT_4', 'ENDED'],
    ACT_4: ['ENDED'],
    ENDED: [],
  };
  
  if (!validTransitions[room.status].includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from ${room.status} to ${targetStatus}`,
    };
  }
  
  const currentAct = ACTS[room.status];
  if (currentAct && room.current_round < currentAct.minRounds) {
    return {
      allowed: false,
      reason: `Need at least ${currentAct.minRounds} rounds before transitioning`,
    };
  }
  
  return {
    allowed: true,
    newStatus: targetStatus,
  };
}

export function getNextAct(currentStatus: RoomStatus): RoomStatus | null {
  const progression: Record<RoomStatus, RoomStatus | null> = {
    LOBBY: 'ACT_1',
    ACT_1: 'ACT_2',
    ACT_2: 'ACT_3',
    ACT_3: 'ACT_4',
    ACT_4: 'ENDED',
    ENDED: null,
  };
  
  return progression[currentStatus];
}

// ===== HEAT MANAGEMENT =====

export interface HeatFactors {
  nearMissCount: number;
  negotiationCount: number;
  splitVotesYes: number;
  splitVotesNo: number;
  tunnelCount: number;
  averageEngagement: number;
}

export function calculateHeat(
  currentHeat: number,
  factors: HeatFactors,
  energyMode: EnergyMode
): number {
  let delta = 0;
  
  // Near-misses raise heat
  delta += factors.nearMissCount * 0.3;
  
  // Negotiations raise heat
  delta += factors.negotiationCount * 0.2;
  
  // Split votes (yes) raise heat significantly
  delta += factors.splitVotesYes * 0.5;
  
  // Split votes (no) cool things down slightly
  delta -= factors.splitVotesNo * 0.1;
  
  // Tunnels raise heat
  delta += factors.tunnelCount * 0.2;
  
  // High engagement raises heat
  if (factors.averageEngagement > 0.7) {
    delta += 0.2;
  }
  
  // Energy mode multiplier
  const multipliers: Record<EnergyMode, number> = {
    DAYLIGHT: 0.5,
    DUSK: 1.0,
    MIDNIGHT: 1.5,
  };
  
  delta *= multipliers[energyMode];
  
  // Clamp to 1-10
  return Math.max(1, Math.min(10, currentHeat + delta));
}

// ===== PLAYER MANAGEMENT =====

export function shouldSpotlightPlayer(
  player: Player,
  recentEvents: GameEvent[]
): boolean {
  // Check how many recent events featured this player
  const recentMentions = recentEvents.filter(e => 
    e.metadata && 
    typeof e.metadata === 'object' &&
    'player_ids' in e.metadata &&
    Array.isArray(e.metadata.player_ids) &&
    e.metadata.player_ids.includes(player.id)
  ).length;
  
  // Low spotlight = should feature more
  // High spotlight comfort + low mentions = good candidate
  if (player.profile.spotlight_comfort > 0.5 && recentMentions < 2) {
    return true;
  }
  
  // Low spotlight comfort + low mentions = maybe gentle nudge
  if (player.profile.spotlight_comfort < 0.3 && recentMentions === 0) {
    return true; // But prompts should be softer
  }
  
  return false;
}

export function getQuietPlayers(
  players: Player[],
  recentEvents: GameEvent[],
  threshold: number = 3
): Player[] {
  return players.filter(p => {
    const mentions = recentEvents.filter(e =>
      e.metadata &&
      typeof e.metadata === 'object' &&
      'player_ids' in e.metadata &&
      Array.isArray(e.metadata.player_ids) &&
      e.metadata.player_ids.includes(p.id)
    ).length;
    
    return mentions < threshold;
  });
}

// ===== SPLIT MECHANICS =====

export interface SplitResult {
  mainRoom: Player[];
  lounge: Player[];
  splitOccurred: boolean;
}

export function processSplitVotes(
  players: Player[],
  votes: { player_id: string; vote: 'YES' | 'NO' }[]
): SplitResult {
  const voteMap = new Map(votes.map(v => [v.player_id, v.vote]));
  
  const mainRoom: Player[] = [];
  const lounge: Player[] = [];
  
  for (const player of players) {
    const vote = voteMap.get(player.id);
    if (vote === 'YES') {
      mainRoom.push(player);
    } else {
      lounge.push(player);
    }
  }
  
  return {
    mainRoom,
    lounge,
    splitOccurred: lounge.length > 0 && mainRoom.length > 0,
  };
}

// ===== GAME FLOW =====

export interface RoundConfig {
  prompt: {
    mechanic: string;
    tier: number;
    requiresCharacterMask: boolean;
  };
  includeTunnel: boolean;
  includeSecretTask: boolean;
  includeNegotiation: boolean;
  includeSpin: boolean;
}

export function generateRoundConfig(
  room: Room,
  roundNumber: number,
  playerCount: number
): RoundConfig {
  const act = ACTS[room.status];
  if (!act) {
    throw new Error(`Invalid room status: ${room.status}`);
  }
  
  // Select mechanic based on act
  const mechanics = act.allowedMechanics;
  const mechanic = mechanics[roundNumber % mechanics.length];
  
  // Tier scales with round and heat
  const baseTier = Math.min(
    act.maxTier,
    Math.max(act.minTier, Math.floor(roundNumber / 2) + act.minTier)
  );
  const tier = Math.min(act.maxTier, baseTier + Math.floor(room.heat_level / 3));
  
  // Features based on act and mechanics
  const config: RoundConfig = {
    prompt: {
      mechanic,
      tier,
      requiresCharacterMask: true,
    },
    includeTunnel: 
      mechanics.includes('SECRET') && 
      roundNumber % 3 === 0 && 
      playerCount >= 4,
    includeSecretTask:
      mechanics.includes('SECRET') &&
      roundNumber % 4 === 1,
    includeNegotiation:
      mechanics.includes('NEGOTIATION') &&
      room.heat_level >= 5,
    includeSpin:
      mechanics.includes('CHANCE') ||
      (act.canEscalate && roundNumber % 2 === 0),
  };
  
  return config;
}

// ===== END GAME =====

export interface GameSummary {
  totalRounds: number;
  peakHeat: number;
  nearMissCount: number;
  tunnelCount: number;
  negotiationCount: number;
  mostActivePlayer: string;
  quietestPlayer: string;
  finalHeat: number;
}

export function generateGameSummary(
  room: Room,
  players: Player[],
  events: GameEvent[]
): GameSummary {
  const nearMisses = events.filter(e => e.event_type === 'NEAR_MISS').length;
  const tunnels = events.filter(e => e.event_type === 'TUNNEL_SUMMARY').length;
  const negotiations = events.filter(e => e.event_type === 'NEGOTIATION').length;
  
  // Find most/least active by instigator points
  const sortedByActivity = [...players].sort(
    (a, b) => b.instigator_points - a.instigator_points
  );
  
  return {
    totalRounds: room.current_round,
    peakHeat: Math.max(room.heat_level, ...events
      .filter(e => e.metadata && typeof e.metadata === 'object' && 'heat' in e.metadata)
      .map(e => (e.metadata as { heat: number }).heat || 0)
    ),
    nearMissCount: nearMisses,
    tunnelCount: tunnels,
    negotiationCount: negotiations,
    mostActivePlayer: sortedByActivity[0]?.character_name || 'Unknown',
    quietestPlayer: sortedByActivity[sortedByActivity.length - 1]?.character_name || 'Unknown',
    finalHeat: room.heat_level,
  };
}

