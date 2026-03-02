'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Player } from '@/lib/types';

// =========================
// NPC MANAGER
// "The Westworld Control Room"
// =========================

interface NPCTemplate {
  id: string;
  name: string;
  tagline: string;
  difficulty: string;
  personality_preview: {
    flirtiness: number;
    chaos: number;
    honesty: number;
  };
}

interface SpawnedNPC {
  id: string;
  character_name: string;
  persona_name: string;
  is_alive: boolean;
  relationships: Array<{ with: string; type: string }>;
}

interface NPCManagerProps {
  roomId: string;
  players: Player[];
  onNPCSpawned?: (npc: SpawnedNPC) => void;
  onNPCKilled?: (npcId: string) => void;
}

// Pre-defined game relationship scenarios
const RELATIONSHIP_SCENARIOS = [
  {
    id: 'married_bored',
    label: 'Married (Bored)',
    type: 'married',
    public_status: 'Happily married',
    secret_status: 'Looking for excitement',
  },
  {
    id: 'dating_new',
    label: 'Dating (New)',
    type: 'dating',
    public_status: 'Just started dating',
    secret_status: null,
  },
  {
    id: 'affair_secret',
    label: 'Secret Affair',
    type: 'affair',
    public_status: 'Just friends',
    secret_status: 'Sleeping together',
  },
  {
    id: 'exes_tension',
    label: 'Exes (Tension)',
    type: 'exes',
    public_status: 'Moved on',
    secret_status: 'Still has feelings',
  },
  {
    id: 'one_sided',
    label: 'One-Sided Crush',
    type: 'one_sided_crush',
    public_status: 'Friends',
    secret_status: 'Secretly in love',
  },
];

export const NPCManager: React.FC<NPCManagerProps> = ({
  roomId,
  players,
  onNPCSpawned,
  onNPCKilled,
}) => {
  const [templates, setTemplates] = useState<NPCTemplate[]>([]);
  const [spawnedNPCs, setSpawnedNPCs] = useState<SpawnedNPC[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NPCTemplate | null>(null);
  const [assignedRelationships, setAssignedRelationships] = useState<Array<{
    with_character: string;
    type: string;
    public_status: string;
    secret_status?: string;
  }>>([]);

  // Fetch available templates
  useEffect(() => {
    fetch('/api/npc/spawn')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(console.error);
  }, []);

  // Fetch spawned NPCs
  useEffect(() => {
    fetch(`/api/npc/spawn?room_id=${roomId}`)
      .then(res => res.json())
      .then(data => setSpawnedNPCs(data.npcs || []))
      .catch(console.error);
  }, [roomId]);

  // Spawn an NPC
  const handleSpawn = async () => {
    if (!selectedTemplate) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/npc/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          template_id: selectedTemplate.id,
          assigned_relationships: assignedRelationships,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSpawnedNPCs(prev => [...prev, { ...data.npc, is_alive: true }]);
        onNPCSpawned?.(data.npc);
        setShowSpawnModal(false);
        setSelectedTemplate(null);
        setAssignedRelationships([]);
      }
    } catch (error) {
      console.error('Spawn failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Kill an NPC
  const handleKill = async (npcId: string) => {
    if (!confirm('Are you sure you want to kill this character? 💀')) return;

    try {
      const response = await fetch('/api/npc/spawn', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, npc_id: npcId }),
      });

      const data = await response.json();
      if (data.success) {
        setSpawnedNPCs(prev => prev.map(n => 
          n.id === npcId ? { ...n, is_alive: false } : n
        ));
        onNPCKilled?.(npcId);
      }
    } catch (error) {
      console.error('Kill failed:', error);
    }
  };

  // Add relationship
  const addRelationship = (scenario: typeof RELATIONSHIP_SCENARIOS[0], withCharacter: string) => {
    setAssignedRelationships(prev => [
      ...prev,
      {
        with_character: withCharacter,
        type: scenario.type,
        public_status: scenario.public_status,
        secret_status: scenario.secret_status || undefined,
      },
    ]);
  };

  // Test NPC message
  const testNPCMessage = async (npc: SpawnedNPC, targetPlayer: string) => {
    try {
      const template = templates.find(t => t.name === npc.persona_name);
      // In real implementation, we'd have the full persona stored
      const response = await fetch('/api/npc/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'message',
          persona: {
            name: npc.character_name,
            // This would come from actual storage
            personality: { flirtiness: 0.7, chaos: 0.5, honesty: 0.5 },
            speaking_style: { vocabulary: 'normal', emoji_usage: 'moderate', message_length: 'normal', tone: 'casual' },
          },
          target_player: targetPlayer,
          context: { room_heat: 5, other_players: players.map(p => p.character_name) },
        }),
      });
      
      const data = await response.json();
      alert(`${npc.character_name} says to ${targetPlayer}:\n\n"${data.message || data.content}"`);
    } catch (error) {
      console.error('Message failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
          🤖 NPC Cast
          <span className="text-xs font-normal text-gray-500">
            ({spawnedNPCs.filter(n => n.is_alive).length} active)
          </span>
        </h3>
        <Button
          onClick={() => setShowSpawnModal(true)}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600"
        >
          + Spawn NPC
        </Button>
      </div>

      {/* Active NPCs */}
      <div className="space-y-2">
        {spawnedNPCs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No NPCs spawned yet. Add some characters to the game!
          </p>
        ) : (
          spawnedNPCs.map((npc) => (
            <motion.div
              key={npc.id}
              layout
              className={`p-3 rounded-lg border ${
                npc.is_alive 
                  ? 'bg-black/40 border-purple-500/30' 
                  : 'bg-red-950/30 border-red-500/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    npc.is_alive ? 'bg-purple-600' : 'bg-red-900'
                  }`}>
                    {npc.is_alive ? '🤖' : '💀'}
                  </div>
                  <div>
                    <p className="font-bold">{npc.character_name}</p>
                    <p className="text-xs text-gray-500">{npc.persona_name}</p>
                    {npc.relationships.length > 0 && (
                      <p className="text-xs text-purple-400">
                        {npc.relationships.map(r => `${r.type} w/ ${r.with}`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                
                {npc.is_alive && (
                  <div className="flex gap-1">
                    <select
                      className="text-xs bg-black/40 border border-gray-700 rounded px-2 py-1"
                      onChange={(e) => {
                        if (e.target.value) testNPCMessage(npc, e.target.value);
                      }}
                      defaultValue=""
                    >
                      <option value="">Message...</option>
                      {players.map(p => (
                        <option key={p.id} value={p.character_name}>
                          {p.character_name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleKill(npc.id)}
                    >
                      💀
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Spawn Modal */}
      <AnimatePresence>
        {showSpawnModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowSpawnModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-gray-900 rounded-xl border border-purple-500/30 p-6"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Spawn NPC Character</h2>

              {/* Template Selection */}
              {!selectedTemplate ? (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">Choose a character template:</p>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full p-4 rounded-lg border border-gray-700 hover:border-purple-500 bg-black/40 text-left transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{template.name}</p>
                          <p className="text-sm text-gray-400">{template.tagline}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          template.difficulty === 'hard' ? 'bg-red-900 text-red-300' :
                          template.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-green-900 text-green-300'
                        }`}>
                          {template.difficulty}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className="text-xs">🔥 {Math.round(template.personality_preview.flirtiness * 100)}%</span>
                        <span className="text-xs">😈 {Math.round(template.personality_preview.chaos * 100)}%</span>
                        <span className="text-xs">🎭 {Math.round((1 - template.personality_preview.honesty) * 100)}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected template */}
                  <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-500/50">
                    <p className="font-bold">{selectedTemplate.name}</p>
                    <p className="text-sm text-gray-400">{selectedTemplate.tagline}</p>
                  </div>

                  {/* Assign relationships */}
                  <div>
                    <p className="font-medium mb-2">Assign Relationships:</p>
                    
                    {/* Current relationships */}
                    {assignedRelationships.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {assignedRelationships.map((rel, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-black/30 p-2 rounded">
                            <span>{rel.type} with {rel.with_character}</span>
                            <button
                              onClick={() => setAssignedRelationships(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new relationship */}
                    <div className="grid grid-cols-2 gap-2">
                      {RELATIONSHIP_SCENARIOS.map((scenario) => (
                        <div key={scenario.id} className="space-y-1">
                          <p className="text-xs text-gray-400">{scenario.label}</p>
                          <select
                            className="w-full text-sm bg-black/40 border border-gray-700 rounded px-2 py-1"
                            onChange={(e) => {
                              if (e.target.value) {
                                addRelationship(scenario, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">Select player...</option>
                            {players.map(p => (
                              <option key={p.id} value={p.character_name}>
                                {p.character_name} ({p.real_name})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setAssignedRelationships([]);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSpawn}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {isLoading ? 'Spawning...' : `Spawn ${selectedTemplate.name}`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setShowSpawnModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <p className="text-xs text-gray-600 text-center">
        NPCs answer prompts, send messages, and can be killed for drama. 🦷⟐
      </p>
    </div>
  );
};

