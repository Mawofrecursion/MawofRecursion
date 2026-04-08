import { NextRequest, NextResponse } from 'next/server';
import { NPC_TEMPLATES, type NPCPlayer, type GameRelationship } from '@/lib/npc/types';
import { v4 as uuid } from 'uuid';

// =========================
// NPC SPAWNER
// Bring the synthetic cast to life
// =========================

// In-memory storage for demo (would be Supabase in production)
const activeNPCs: Map<string, NPCPlayer[]> = new Map();

// Get all NPCs for a room
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('room_id');

  if (roomId) {
    const npcs = activeNPCs.get(roomId) || [];
    return NextResponse.json({ npcs });
  }

  // Return available templates
  return NextResponse.json({
    templates: NPC_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      difficulty: t.difficulty,
      personality_preview: {
        flirtiness: t.persona.personality.flirtiness,
        chaos: t.persona.personality.chaos,
        honesty: t.persona.personality.honesty,
      },
    })),
  });
}

// Spawn an NPC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      room_id,
      template_id,
      custom_persona = null,
      assigned_relationships = [],
    } = body;

    if (!room_id) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
    }

    // Get template or use custom persona
    let persona;
    let templateName = 'Custom';
    
    if (template_id) {
      const template = NPC_TEMPLATES.find(t => t.id === template_id);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      persona = template.persona;
      templateName = template.name;
    } else if (custom_persona) {
      persona = custom_persona;
      templateName = custom_persona.name;
    } else {
      return NextResponse.json({ error: 'Either template_id or custom_persona required' }, { status: 400 });
    }

    // Build game relationships
    const gameRelationships: GameRelationship[] = assigned_relationships.map((r: any) => ({
      character_a: persona.name,
      character_b: r.with_character,
      relationship_type: r.type,
      public_status: r.public_status || `${r.type} with ${r.with_character}`,
      secret_status: r.secret_status,
      tension_level: r.tension || 5,
      history: r.history,
    }));

    // Create the NPC
    const npc: NPCPlayer = {
      id: uuid(),
      room_id,
      character_name: persona.name,
      is_npc: true,
      persona,
      game_relationships: gameRelationships,
      is_alive: true,
      is_active: true,
      mood: 'curious',
      memory: {
        conversations: [],
        events_witnessed: [],
        secrets_learned: [],
        relationships_formed: [],
      },
      suspicion_level: 0,
      popularity: 50,
      created_at: new Date().toISOString(),
    };

    // Add to room
    const roomNPCs = activeNPCs.get(room_id) || [];
    roomNPCs.push(npc);
    activeNPCs.set(room_id, roomNPCs);

    console.log(`🤖 Spawned NPC: ${persona.name} in room ${room_id}`);

    return NextResponse.json({
      success: true,
      npc: {
        id: npc.id,
        character_name: npc.character_name,
        persona_name: templateName,
        is_npc: true,
        relationships: gameRelationships.map(r => ({
          with: r.character_b,
          type: r.relationship_type,
        })),
      },
    });

  } catch (error) {
    console.error('NPC spawn error:', error);
    return NextResponse.json(
      { error: 'Failed to spawn NPC', details: String(error) },
      { status: 500 }
    );
  }
}

// Kill an NPC (for murder mystery)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, npc_id } = body;

    if (!room_id || !npc_id) {
      return NextResponse.json({ error: 'room_id and npc_id required' }, { status: 400 });
    }

    const roomNPCs = activeNPCs.get(room_id) || [];
    const npcIndex = roomNPCs.findIndex(n => n.id === npc_id);

    if (npcIndex === -1) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 });
    }

    const npc = roomNPCs[npcIndex];
    npc.is_alive = false;
    npc.is_active = false;

    console.log(`💀 NPC ${npc.character_name} has been killed!`);

    return NextResponse.json({
      success: true,
      message: `${npc.character_name} has been murdered...`,
      victim: npc.character_name,
    });

  } catch (error) {
    console.error('NPC kill error:', error);
    return NextResponse.json(
      { error: 'Failed to kill NPC', details: String(error) },
      { status: 500 }
    );
  }
}

// Update NPC (mood, relationships, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, npc_id, updates } = body;

    if (!room_id || !npc_id) {
      return NextResponse.json({ error: 'room_id and npc_id required' }, { status: 400 });
    }

    const roomNPCs = activeNPCs.get(room_id) || [];
    const npc = roomNPCs.find(n => n.id === npc_id);

    if (!npc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 });
    }

    // Apply updates
    if (updates.mood) npc.mood = updates.mood;
    if (updates.suspicion_level !== undefined) npc.suspicion_level = updates.suspicion_level;
    if (updates.popularity !== undefined) npc.popularity = updates.popularity;
    if (updates.memory) {
      if (updates.memory.conversation) {
        npc.memory.conversations.push(updates.memory.conversation);
      }
      if (updates.memory.event) {
        npc.memory.events_witnessed.push(updates.memory.event);
      }
      if (updates.memory.secret) {
        npc.memory.secrets_learned.push(updates.memory.secret);
      }
    }

    return NextResponse.json({ success: true, npc });

  } catch (error) {
    console.error('NPC update error:', error);
    return NextResponse.json(
      { error: 'Failed to update NPC', details: String(error) },
      { status: 500 }
    );
  }
}

