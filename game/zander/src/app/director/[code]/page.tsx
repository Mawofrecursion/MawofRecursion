'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlayerCard } from '@/components/game/PlayerCard';
import { StoryTrigger } from '@/components/tv/StoryOverlay';
import { NPCManager } from '@/components/director/NPCManager';
import { MOCK_ROOM, MOCK_PLAYERS } from '@/lib/mock-data';
import type { Room, EnergyMode } from '@/lib/types';

export default function DirectorPage() {
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room>(MOCK_ROOM);
  const [players] = useState(MOCK_PLAYERS);
  const [paused, setPaused] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [lastStoryError, setLastStoryError] = useState<string | null>(null);

  // Generate and broadcast a story to the TV
  const handleStoryTrigger = async (characterA: string, characterB: string, trope: string, genre: string) => {
    setIsGeneratingStory(true);
    setLastStoryError(null);
    
    try {
      const response = await fetch('/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_a: characterA,
          character_b: characterB,
          trope,
          genre,
          intensity: Math.min(10, room.heat_level + 2), // Scale with room heat
          room_id: room.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const storyData = await response.json();
      
      // Broadcast to TV (in real app, this would go through Supabase)
      // For now, use a custom event
      window.dispatchEvent(new CustomEvent('story-trigger', { detail: storyData }));
      
      // Also try to notify other windows (like the TV)
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(`zander_${code}`);
        channel.postMessage({ type: 'STORY_CUTSCENE', data: storyData });
        channel.close();
      }
      
    } catch (error) {
      console.error('Story generation failed:', error);
      setLastStoryError(String(error));
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleEnergyChange = (mode: EnergyMode) => {
    setRoom((prev) => ({ ...prev, energy_mode: mode }));
  };

  const handleHeatChange = (delta: number) => {
    setRoom((prev) => ({
      ...prev,
      heat_level: Math.max(1, Math.min(10, prev.heat_level + delta)),
    }));
  };

  const handleAdvanceAct = () => {
    const acts: Room['status'][] = ['LOBBY', 'ACT_1', 'ACT_2', 'ACT_3', 'ACT_4', 'ENDED'];
    const currentIndex = acts.indexOf(room.status);
    if (currentIndex < acts.length - 1) {
      setRoom((prev) => ({
        ...prev,
        status: acts[currentIndex + 1],
        current_act: Math.min(4, prev.current_act + 1),
      }));
    }
  };

  const handleNextRound = () => {
    setRoom((prev) => ({
      ...prev,
      current_round: prev.current_round + 1,
    }));
  };

  return (
    <main 
      className="min-h-screen p-6"
      data-energy={room.energy_mode}
    >
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-abyss)] to-[var(--color-surface)] -z-10" />

      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[var(--color-text-muted)]">Director Console</span>
            <h1 className="font-display text-2xl font-bold">Room {code}</h1>
          </div>
          <Button
            variant={paused ? 'danger' : 'ghost'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </Button>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display font-semibold mb-4">Game State</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-[var(--color-text-muted)]">Status</span>
              <p className="font-mono text-lg">{room.status}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--color-text-muted)]">Round</span>
              <p className="font-mono text-lg">{room.current_round}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNextRound}>Next Round</Button>
            <Button size="sm" variant="ghost" onClick={handleAdvanceAct}>Advance Act</Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display font-semibold mb-4">Energy Mode</h2>
          <div className="flex gap-2">
            {(['DAYLIGHT', 'DUSK', 'MIDNIGHT'] as EnergyMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleEnergyChange(mode)}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  room.energy_mode === mode
                    ? 'bg-[var(--accent-primary)] text-[var(--color-void)]'
                    : 'bg-[var(--color-abyss)] text-[var(--color-text-secondary)] hover:bg-white/5'
                }`}
              >
                {mode === 'DAYLIGHT' && '☀️'}
                {mode === 'DUSK' && '🌆'}
                {mode === 'MIDNIGHT' && '🌙'}
                <span className="ml-2 text-sm">{mode}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display font-semibold mb-4">Heat Level</h2>
          <div className="mb-4">
            <div className="h-3 bg-[var(--color-abyss)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-ice)] via-[var(--color-heat)] to-[var(--color-ember)]"
                animate={{ width: `${room.heat_level * 10}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-[var(--color-text-muted)]">
              <span>Cool</span>
              <span className="font-mono">{room.heat_level}/10</span>
              <span>Hot</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleHeatChange(-1)} disabled={room.heat_level <= 1}>
              Cool Down
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleHeatChange(1)} disabled={room.heat_level >= 10}>
              Heat Up
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display font-semibold mb-4">Players ({players.length})</h2>
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-abyss)]">
                <PlayerCard player={player} size="sm" showRole={false} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.character_name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{player.character_role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="text-[var(--color-gold)]">{player.instigator_points}</span> pts
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {Math.round(player.engagement_score * 100)}% engaged
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* STORY DIRECTOR - The "Dirty Book" Engine */}
        <Card className="md:col-span-2">
          <StoryTrigger
            players={players.map(p => ({
              id: p.id,
              character_name: p.character_name,
              real_name: p.real_name,
            }))}
            onTrigger={handleStoryTrigger}
            isGenerating={isGeneratingStory}
          />
          {lastStoryError && (
            <p className="mt-2 text-sm text-red-400">Error: {lastStoryError}</p>
          )}
        </Card>

        {/* NPC MANAGER - The Westworld Control Room */}
        <Card className="md:col-span-2">
          <NPCManager
            roomId={room.id}
            players={players}
            onNPCSpawned={(npc) => console.log('NPC spawned:', npc)}
            onNPCKilled={(id) => console.log('NPC killed:', id)}
          />
        </Card>

        <Card className="md:col-span-2">
          <h2 className="font-display font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" size="sm">🎰 Trigger Spin</Button>
            <Button variant="ghost" size="sm">🤫 Send Secret Task</Button>
            <Button variant="ghost" size="sm">💬 Open Tunnel</Button>
            <Button variant="ghost" size="sm">🎭 AI Commentary</Button>
            <Button variant="ghost" size="sm">⚖️ Propose Split</Button>
            <Button variant="danger" size="sm">🛑 End Game</Button>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <a href={`/tv/${code}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline">
          Open TV Display →
        </a>
      </motion.div>
    </main>
  );
}
