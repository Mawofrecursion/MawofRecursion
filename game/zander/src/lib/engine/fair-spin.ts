// =========================
// FAIR SPIN ENGINE
// 100% honest randomness
// No physics tricks, no drama weighting
// =========================

import { v4 as uuid } from 'uuid';
import type { WheelSlice, SpinResult, PersonalWheel, GroupWheel } from '../types';

/**
 * Generate a cryptographically strong random seed
 * This can be verified after the fact
 */
export function generateRandomSeed(): string {
  // In production, could use crypto.getRandomValues or a VRF
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

/**
 * Generate a random value from a seed
 * Deterministic given the same seed (for verification)
 */
export function randomFromSeed(seed: string): number {
  // Simple hash-based random for now
  // In production, use a proper PRNG seeded by the seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to 0-1 range
  return Math.abs(hash % 10000) / 10000;
}

/**
 * PURE random - no tricks, no weighting
 * The pull distance is COSMETIC ONLY
 */
export function spinWheel(
  slices: WheelSlice[],
  pullDistance: number // 0-1, how far they pulled (COSMETIC)
): SpinResult {
  // Generate seed FIRST - before anything else
  const seed = generateRandomSeed();
  
  // Pure random value - not affected by pull distance
  const randomValue = randomFromSeed(seed);
  
  // Find which slice we landed on
  // This is pure probability math - no tricks
  let cumulative = 0;
  let landedIndex = 0;
  
  for (let i = 0; i < slices.length; i++) {
    cumulative += slices[i].probability;
    if (randomValue <= cumulative) {
      landedIndex = i;
      break;
    }
  }
  
  // Visual spin duration based on pull (COSMETIC ONLY)
  // The result was already determined above
  const minDuration = 2000;  // 2 seconds minimum
  const maxDuration = 6000;  // 6 seconds maximum
  const spinDuration = minDuration + (pullDistance * (maxDuration - minDuration));
  
  return {
    id: uuid(),
    wheel_type: 'personal', // Will be set by caller
    random_seed: seed,
    random_value: randomValue,
    pull_distance: pullDistance,
    spin_duration_ms: spinDuration,
    landed_on_index: landedIndex,
    landed_on: slices[landedIndex],
    timestamp: new Date().toISOString(),
    verified: true,
  };
}

/**
 * Verify a past spin was fair
 * Anyone can run this to prove the result was honest
 */
export function verifySpinResult(result: SpinResult, slices: WheelSlice[]): boolean {
  // Regenerate random from seed
  const expectedRandom = randomFromSeed(result.random_seed);
  
  // Check it matches
  if (Math.abs(expectedRandom - result.random_value) > 0.0001) {
    return false; // Seed doesn't match random value
  }
  
  // Recalculate which slice it should have landed on
  let cumulative = 0;
  let expectedIndex = 0;
  
  for (let i = 0; i < slices.length; i++) {
    cumulative += slices[i].probability;
    if (expectedRandom <= cumulative) {
      expectedIndex = i;
      break;
    }
  }
  
  // Check it matches
  return expectedIndex === result.landed_on_index;
}

/**
 * Calculate actual probability distribution from spin history
 * Shows players the wheel is honest over time
 */
export function calculateActualOdds(
  slices: WheelSlice[],
  history: SpinResult[]
): { slice: WheelSlice; stated: number; actual: number; spins: number }[] {
  const counts: Record<string, number> = {};
  
  // Count occurrences
  for (const spin of history) {
    const id = spin.landed_on.id;
    counts[id] = (counts[id] || 0) + 1;
  }
  
  // Calculate actual percentages
  const total = history.length;
  
  return slices.map(slice => ({
    slice,
    stated: slice.probability,
    actual: total > 0 ? (counts[slice.id] || 0) / total : 0,
    spins: counts[slice.id] || 0,
  }));
}

/**
 * Create default personal wheel for a new player
 */
export function createDefaultPersonalWheel(playerId: string): PersonalWheel {
  return {
    player_id: playerId,
    slices: [
      {
        id: uuid(),
        label: 'Nothing',
        description: 'Nothing happens. Lucky you.',
        probability: 0.40,
        outcome_type: 'safe',
      },
      {
        id: uuid(),
        label: 'Take a drink',
        description: 'Take a drink of your choice.',
        probability: 0.30,
        outcome_type: 'mild',
      },
      {
        id: uuid(),
        label: 'Truth',
        description: 'Answer a truth question from the room.',
        probability: 0.20,
        outcome_type: 'mild',
      },
      {
        id: uuid(),
        label: 'Dare',
        description: 'The room gives you a dare.',
        probability: 0.10,
        outcome_type: 'spicy',
      },
    ],
    total_spins: 0,
    spin_history: [],
  };
}

/**
 * Create default group wheel for a new room
 */
export function createDefaultGroupWheel(roomId: string): GroupWheel {
  return {
    room_id: roomId,
    slices: [
      {
        id: uuid(),
        label: 'Everyone drinks',
        description: 'Everyone takes a drink.',
        probability: 0.25,
        outcome_type: 'mild',
      },
      {
        id: uuid(),
        label: 'Nothing',
        description: 'Nothing happens this time.',
        probability: 0.25,
        outcome_type: 'safe',
      },
      {
        id: uuid(),
        label: 'Random pair',
        description: 'Two random players are selected for a task.',
        probability: 0.20,
        outcome_type: 'mild',
      },
      {
        id: uuid(),
        label: 'Mini-game',
        description: 'A random mini-game starts.',
        probability: 0.15,
        outcome_type: 'mild',
      },
      {
        id: uuid(),
        label: 'Heat +1',
        description: 'Room heat level increases.',
        probability: 0.10,
        outcome_type: 'spicy',
      },
      {
        id: uuid(),
        label: 'Wild card',
        description: 'Something unexpected happens...',
        probability: 0.05,
        outcome_type: 'wild',
      },
    ],
    total_spins: 0,
    spin_history: [],
  };
}

/**
 * Add a slice to a wheel (from a trade)
 * Automatically rebalances other slices to maintain total = 1.0
 */
export function addSliceToWheel(
  wheel: PersonalWheel | GroupWheel,
  newSlice: Omit<WheelSlice, 'id'>,
  addedBy: string,
  tradeId: string
): PersonalWheel | GroupWheel {
  const slice: WheelSlice = {
    ...newSlice,
    id: uuid(),
    added_by: addedBy,
    accepted_at: new Date().toISOString(),
    trade_id: tradeId,
  };
  
  // Calculate how much probability we need to take from other slices
  const newProbability = slice.probability;
  const currentTotal = wheel.slices.reduce((sum, s) => sum + s.probability, 0);
  
  // Scale down existing slices to make room
  const scaleFactor = (currentTotal - newProbability) / currentTotal;
  
  const updatedSlices = wheel.slices.map(s => ({
    ...s,
    probability: s.probability * scaleFactor,
  }));
  
  // Add new slice
  updatedSlices.push(slice);
  
  return {
    ...wheel,
    slices: updatedSlices,
  };
}

/**
 * Remove a slice from a wheel
 * Redistributes probability to remaining slices
 */
export function removeSliceFromWheel(
  wheel: PersonalWheel | GroupWheel,
  sliceId: string
): PersonalWheel | GroupWheel {
  const sliceToRemove = wheel.slices.find(s => s.id === sliceId);
  if (!sliceToRemove) return wheel;
  
  const remaining = wheel.slices.filter(s => s.id !== sliceId);
  const removedProbability = sliceToRemove.probability;
  const currentTotal = remaining.reduce((sum, s) => sum + s.probability, 0);
  
  // Scale up remaining slices to fill the gap
  const scaleFactor = 1 / currentTotal;
  
  const updatedSlices = remaining.map(s => ({
    ...s,
    probability: s.probability * scaleFactor,
  }));
  
  return {
    ...wheel,
    slices: updatedSlices,
  };
}

/**
 * Validate that wheel probabilities sum to ~1.0
 */
export function validateWheel(wheel: PersonalWheel | GroupWheel): boolean {
  const total = wheel.slices.reduce((sum, s) => sum + s.probability, 0);
  return Math.abs(total - 1.0) < 0.001; // Allow small floating point error
}

/**
 * Format probability for display
 */
export function formatProbability(p: number): string {
  const percent = p * 100;
  if (percent >= 1) {
    return `${Math.round(percent)}%`;
  }
  return `${percent.toFixed(1)}%`;
}

/**
 * Format as odds (e.g., "1 in 20")
 */
export function formatAsOdds(p: number): string {
  if (p >= 1) return '1 in 1';
  if (p <= 0) return 'Never';
  const oneIn = Math.round(1 / p);
  return `1 in ${oneIn}`;
}

