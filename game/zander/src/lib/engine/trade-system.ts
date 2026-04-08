// =========================
// TRADE SYSTEM
// Consent economics for wheel modifications
// =========================

import { v4 as uuid } from 'uuid';
import type { 
  TradeProposal, 
  CompletedTrade, 
  WheelSlice, 
  PersonalWheel,
  Player 
} from '../types';
import { addSliceToWheel } from './fair-spin';

/**
 * Create a new trade proposal
 */
export function createTradeProposal(
  roomId: string,
  roundNumber: number,
  proposerIds: string[],
  targetPlayerId: string,
  proposedSlice: Omit<WheelSlice, 'id' | 'added_by' | 'accepted_at' | 'trade_id'>
): TradeProposal {
  return {
    id: uuid(),
    room_id: roomId,
    round_number: roundNumber,
    proposer_ids: proposerIds,
    target_player_id: targetPlayerId,
    proposed_slice: proposedSlice,
    status: 'proposed',
    created_at: new Date().toISOString(),
  };
}

/**
 * Create a counter-offer to a trade proposal
 */
export function counterTradeProposal(
  proposal: TradeProposal,
  counterById: string,
  counterTargetPlayerId: string,
  counterSlice: Omit<WheelSlice, 'id' | 'added_by' | 'accepted_at' | 'trade_id'>
): TradeProposal {
  return {
    ...proposal,
    status: 'countered',
    counter_offer: {
      target_player_id: counterTargetPlayerId,
      proposed_slice: counterSlice,
    },
    counter_by: counterById,
  };
}

/**
 * Accept a trade proposal (both parties must agree)
 * Returns the completed trade with both slices to add
 */
export function acceptTradeProposal(
  proposal: TradeProposal,
  acceptedBy: string[]
): CompletedTrade | null {
  // Must have a counter-offer to accept
  if (proposal.status !== 'countered' || !proposal.counter_offer) {
    return null;
  }
  
  const tradeId = uuid();
  
  return {
    id: tradeId,
    room_id: proposal.room_id,
    slice_a: {
      player_id: proposal.target_player_id,
      slice: {
        id: uuid(),
        ...proposal.proposed_slice,
        added_by: proposal.proposer_ids[0],
        accepted_at: new Date().toISOString(),
        trade_id: tradeId,
      },
    },
    slice_b: {
      player_id: proposal.counter_offer.target_player_id,
      slice: {
        id: uuid(),
        ...proposal.counter_offer.proposed_slice,
        added_by: proposal.counter_by!,
        accepted_at: new Date().toISOString(),
        trade_id: tradeId,
      },
    },
    agreed_by: acceptedBy,
    completed_at: new Date().toISOString(),
  };
}

/**
 * Apply a completed trade to the players' wheels
 */
export function applyTrade(
  trade: CompletedTrade,
  wheels: Map<string, PersonalWheel>
): Map<string, PersonalWheel> {
  const updatedWheels = new Map(wheels);
  
  // Add slice A to its target player's wheel
  const wheelA = updatedWheels.get(trade.slice_a.player_id);
  if (wheelA) {
    const updated = addSliceToWheel(
      wheelA,
      trade.slice_a.slice,
      trade.slice_a.slice.added_by!,
      trade.id
    ) as PersonalWheel;
    updatedWheels.set(trade.slice_a.player_id, updated);
  }
  
  // Add slice B to its target player's wheel
  const wheelB = updatedWheels.get(trade.slice_b.player_id);
  if (wheelB) {
    const updated = addSliceToWheel(
      wheelB,
      trade.slice_b.slice,
      trade.slice_b.slice.added_by!,
      trade.id
    ) as PersonalWheel;
    updatedWheels.set(trade.slice_b.player_id, updated);
  }
  
  return updatedWheels;
}

/**
 * Decline a trade proposal
 */
export function declineTradeProposal(proposal: TradeProposal): TradeProposal {
  return {
    ...proposal,
    status: 'declined',
    resolved_at: new Date().toISOString(),
  };
}

/**
 * Check if a trade proposal has expired (default: 5 minutes)
 */
export function isTradeExpired(proposal: TradeProposal, maxAgeMs: number = 5 * 60 * 1000): boolean {
  const created = new Date(proposal.created_at).getTime();
  const now = Date.now();
  return now - created > maxAgeMs;
}

/**
 * Format a trade proposal for display
 */
export function formatTradeProposal(
  proposal: TradeProposal,
  players: Map<string, Player>
): string {
  const target = players.get(proposal.target_player_id);
  const proposers = proposal.proposer_ids
    .map(id => players.get(id)?.character_name || 'Unknown')
    .join(' & ');
  
  let text = `${proposers} proposed: Add "${proposal.proposed_slice.label}" (${Math.round(proposal.proposed_slice.probability * 100)}%) to ${target?.character_name || 'Unknown'}'s wheel.`;
  
  if (proposal.counter_offer) {
    const counterTarget = players.get(proposal.counter_offer.target_player_id);
    const counterBy = players.get(proposal.counter_by!)?.character_name || 'Unknown';
    text += ` Counter by ${counterBy}: Add "${proposal.counter_offer.proposed_slice.label}" (${Math.round(proposal.counter_offer.proposed_slice.probability * 100)}%) to ${counterTarget?.character_name || 'Unknown'}'s wheel.`;
  }
  
  return text;
}

/**
 * Get pending trades for a player (as target or proposer)
 */
export function getPendingTradesForPlayer(
  trades: TradeProposal[],
  playerId: string
): TradeProposal[] {
  return trades.filter(t => 
    (t.status === 'proposed' || t.status === 'countered') &&
    (t.target_player_id === playerId || 
     t.proposer_ids.includes(playerId) ||
     t.counter_offer?.target_player_id === playerId)
  );
}

/**
 * Validate a trade proposal
 */
export function validateTradeProposal(
  proposal: Omit<WheelSlice, 'id' | 'added_by' | 'accepted_at' | 'trade_id'>
): { valid: boolean; error?: string } {
  if (!proposal.label || proposal.label.trim().length === 0) {
    return { valid: false, error: 'Label is required' };
  }
  
  if (proposal.label.length > 50) {
    return { valid: false, error: 'Label must be 50 characters or less' };
  }
  
  if (!proposal.description || proposal.description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }
  
  if (proposal.description.length > 200) {
    return { valid: false, error: 'Description must be 200 characters or less' };
  }
  
  if (proposal.probability < 0.01 || proposal.probability > 0.5) {
    return { valid: false, error: 'Probability must be between 1% and 50%' };
  }
  
  return { valid: true };
}

