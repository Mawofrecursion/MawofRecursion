// =========================
// SUPABASE CLIENT
// =========================

import { createBrowserClient } from '@supabase/ssr';
import type { Room, Player, GameEvent, DesirePattern, Vote, TradeProposal, TunnelLog, SecretTask } from '../types';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create browser client
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ===== ROOM OPERATIONS =====

export async function createRoom(rules: 'CLEAN' | 'SPICY' | 'UNFILTERED' = 'SPICY') {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('rooms')
    .insert({ room_rules: rules })
    .select()
    .single();
  
  if (error) throw error;
  return data as Room;
}

export async function getRoom(code: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();
  
  if (error) throw error;
  return data as Room;
}

export async function updateRoom(id: string, updates: Partial<Room>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Room;
}

// ===== PLAYER OPERATIONS =====

export async function joinRoom(roomId: string, realName: string, isDirector: boolean = false) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('players')
    .insert({
      room_id: roomId,
      real_name: realName,
      role: isDirector ? 'DIRECTOR' : 'PLAYER',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Player;
}

export async function getPlayers(roomId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });
  
  if (error) throw error;
  return data as Player[];
}

export async function updatePlayer(id: string, updates: Partial<Player>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Player;
}

export async function setCharacter(
  playerId: string,
  characterName: string,
  characterRole: string,
  characterBackstory?: string
) {
  return updatePlayer(playerId, {
    character_name: characterName,
    character_role: characterRole,
    character_backstory: characterBackstory,
  });
}

// ===== GAME EVENTS =====

export async function logEvent(
  roomId: string,
  roundNumber: number,
  actNumber: number,
  eventType: GameEvent['event_type'],
  content: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('game_events')
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      act_number: actNumber,
      event_type: eventType,
      content,
      metadata,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as GameEvent;
}

export async function getRecentEvents(roomId: string, limit: number = 20) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('game_events')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as GameEvent[];
}

// ===== DESIRE PATTERNS =====

export async function logDesirePattern(
  roomId: string,
  patternType: DesirePattern['pattern_type'],
  description: string,
  intensity: number,
  whatAlmostHappened?: string,
  howClose?: number
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('desire_patterns')
    .insert({
      room_id: roomId,
      pattern_type: patternType,
      description,
      intensity,
      what_almost_happened: whatAlmostHappened,
      how_close: howClose,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as DesirePattern;
}

export async function getDesirePatterns(roomId: string, limit: number = 10) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('desire_patterns')
    .select('*')
    .eq('room_id', roomId)
    .order('intensity', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as DesirePattern[];
}

export async function surfacePattern(patternId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('desire_patterns')
    .update({
      times_surfaced: supabase.rpc('increment', { x: 1 }),
      last_surfaced_at: new Date().toISOString(),
    })
    .eq('id', patternId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DesirePattern;
}

// ===== VOTES =====

export async function castVote(
  roomId: string,
  roundNumber: number,
  voterId: string,
  voteType: Vote['vote_type'],
  targetPlayerId?: string,
  targetValue?: string
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('votes')
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      voter_id: voterId,
      vote_type: voteType,
      target_player_id: targetPlayerId,
      target_value: targetValue,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Vote;
}

export async function getVotes(roomId: string, roundNumber: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber);
  
  if (error) throw error;
  return data as Vote[];
}

// ===== TUNNELS =====

export async function openTunnel(
  roomId: string,
  playerAId: string,
  playerBId: string,
  characterAName: string,
  characterBName: string
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tunnel_logs')
    .insert({
      room_id: roomId,
      player_a_id: playerAId,
      player_b_id: playerBId,
      character_a_name: characterAName,
      character_b_name: characterBName,
      opened_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as TunnelLog;
}

export async function closeTunnel(
  tunnelId: string,
  durationSeconds: number,
  aiVibeSummary: string
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tunnel_logs')
    .update({
      duration_seconds: durationSeconds,
      ai_vibe_summary: aiVibeSummary,
      closed_at: new Date().toISOString(),
    })
    .eq('id', tunnelId)
    .select()
    .single();
  
  if (error) throw error;
  return data as TunnelLog;
}

// ===== SECRET TASKS =====

export async function assignSecretTask(
  roomId: string,
  roundNumber: number,
  assignedTo: string,
  taskDescription: string,
  timeLimitSeconds: number = 120
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('secret_tasks')
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      assigned_to: assignedTo,
      task_description: taskDescription,
      time_limit_seconds: timeLimitSeconds,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as SecretTask;
}

export async function resolveSecretTask(
  taskId: string,
  claimedCompletion: boolean
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('secret_tasks')
    .update({
      player_claimed_completion: claimedCompletion,
      alternate_consequence_taken: !claimedCompletion,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data as SecretTask;
}

// ===== TRADE PROPOSALS =====

export async function createTradeProposal(
  roomId: string,
  roundNumber: number,
  proposerIds: string[],
  targetPlayerId: string,
  proposedSlice: TradeProposal['proposed_slice']
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trade_proposals')
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      proposer_ids: proposerIds,
      target_player_id: targetPlayerId,
      proposed_slice: proposedSlice,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as TradeProposal;
}

export async function respondToTradeProposal(
  proposalId: string,
  status: 'accepted' | 'declined' | 'countered',
  counterOffer?: TradeProposal['counter_offer'],
  counterBy?: string
) {
  const supabase = createClient();
  
  const updates: Partial<TradeProposal> = { status };
  
  if (status === 'countered' && counterOffer && counterBy) {
    updates.counter_offer = counterOffer;
    updates.counter_by = counterBy;
  }
  
  if (status === 'accepted' || status === 'declined') {
    updates.resolved_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('trade_proposals')
    .update(updates)
    .eq('id', proposalId)
    .select()
    .single();
  
  if (error) throw error;
  return data as TradeProposal;
}

// ===== REALTIME SUBSCRIPTIONS =====

export function subscribeToRoom(
  roomId: string,
  onRoomChange: (room: Room) => void,
  onPlayersChange: (players: Player[]) => void,
  onEventAdded: (event: GameEvent) => void
) {
  const supabase = createClient();
  
  // Subscribe to room changes
  const roomChannel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        if (payload.new) {
          onRoomChange(payload.new as Room);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      async () => {
        // Refetch all players on any change
        const players = await getPlayers(roomId);
        onPlayersChange(players);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'game_events', filter: `room_id=eq.${roomId}` },
      (payload) => {
        if (payload.new) {
          onEventAdded(payload.new as GameEvent);
        }
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(roomChannel);
  };
}

