'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { PlayerCard } from '@/components/game/PlayerCard';
import { PullWheel } from '@/components/game/PullWheel';
import { StoryOverlay, type StoryData } from '@/components/tv/StoryOverlay';
import { MOCK_ROOM, MOCK_PLAYERS } from '@/lib/mock-data';
import type { Room, SpinResult } from '@/lib/types';

type TVState = 'lobby' | 'wheel' | 'narrator' | 'result' | 'story';

export default function TVPage() {
  const params = useParams();
  const code = params.code as string;

  const [room] = useState<Room>(MOCK_ROOM);
  const [players] = useState(MOCK_PLAYERS);
  const [tvState, setTvState] = useState<TVState>('lobby');
  const [narratorText, setNarratorText] = useState('');
  const [currentSpinner, setCurrentSpinner] = useState(MOCK_PLAYERS[0]);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [activeStory, setActiveStory] = useState<StoryData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Listen for story events (in real app, this would be Supabase realtime)
  useEffect(() => {
    // Poll for story events or use realtime subscription
    const handleStoryEvent = (event: CustomEvent<StoryData>) => {
      setActiveStory(event.detail);
      setTvState('story');
    };

    window.addEventListener('story-trigger' as any, handleStoryEvent);
    return () => window.removeEventListener('story-trigger' as any, handleStoryEvent);
  }, []);

  // Handle story completion
  const handleStoryComplete = () => {
    setActiveStory(null);
    setTvState('lobby');
  };

  // Test story trigger (for development)
  const triggerTestStory = async () => {
    const testStory: StoryData = {
      id: `test_${Date.now()}`,
      text: `Detective Morrison knew he shouldn't be here. The rain hammered against the window of the empty ballroom, each drop a warning he chose to ignore. The Starlet stood at the far end, her silhouette framed by lightning. "You came," she said, her voice barely above a whisper. He crossed the distance between them, each step an act of defiance against everything he knew to be right. When he stopped, close enough to feel the warmth radiating from her skin, the air itself seemed to hold its breath. Her eyes found his. Neither moved. Neither spoke. The space between them became its own universe—infinite and shrinking all at once.`,
      imageUrl: '', // Will use gradient fallback
      audioUrl: '',
      audioDuration: 25,
      characters: ['Detective Morrison', 'The Starlet'],
      trope: 'forbidden',
      genre: 'noir',
      intensity: 8,
    };
    setActiveStory(testStory);
    setTvState('story');
  };

  const handleSpinComplete = (result: SpinResult) => {
    setLastResult(result);
    setNarratorText(`${currentSpinner.character_name} landed on: ${result.landed_on.label}`);
    
    setTimeout(() => {
      setTvState('result');
    }, 500);
  };

  const handleShowWheel = (playerId?: string) => {
    const player = playerId 
      ? players.find(p => p.id === playerId) || players[0]
      : players[Math.floor(Math.random() * players.length)];
    setCurrentSpinner(player);
    setTvState('wheel');
  };

  return (
    <main className="tv-display min-h-screen" data-energy={room.energy_mode}>
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-abyss)] to-[var(--color-surface)] -z-10" />
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50" />

      <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div>
          <span className="text-sm text-[var(--color-text-muted)]">Room Code</span>
          <h2 className="font-mono text-3xl tracking-wider">{code}</h2>
        </div>
        <div className="text-right flex items-center gap-4">
          <div>
            <span className="text-sm text-[var(--color-text-muted)]">Act</span>
            <p className="font-display text-2xl font-bold">{room.current_act}/4</p>
          </div>
          <div>
            <span className="text-sm text-[var(--color-text-muted)]">Round</span>
            <p className="font-display text-2xl font-bold">{room.current_round}</p>
          </div>
        </div>
      </header>

      <div className="fixed top-24 left-6 right-6 z-10">
        <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)] mb-2">
          <span>Room Heat</span>
          <span>{room.heat_level}/10</span>
        </div>
        <div className="h-2 bg-[var(--color-abyss)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--color-ice)] via-[var(--color-heat)] to-[var(--color-ember)]"
            animate={{ width: `${room.heat_level * 10}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-8">
        <AnimatePresence mode="wait">
          {tvState === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h1 className="tv-title mb-8">ZANDER</h1>
              <p className="text-xl text-[var(--color-text-secondary)] mb-12">
                {players.length} players connected
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-12">
                {players.map((player) => (
                  <PlayerCard key={player.id} player={player} size="lg" />
                ))}
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <button onClick={() => handleShowWheel()} className="btn btn-primary">
                  🎰 Random Spin
                </button>
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleShowWheel(player.id)}
                    className="btn btn-ghost"
                  >
                    Spin {player.character_name?.split(' ')[0]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {tvState === 'wheel' && (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <h2 className="font-display text-3xl font-bold mb-4">
                {currentSpinner.character_name}&apos;s Wheel
              </h2>
              <p className="text-[var(--color-text-muted)] mb-8">
                Pull down and release to spin
              </p>
              
              <PullWheel
                slices={currentSpinner.personal_wheel.slices}
                onSpinComplete={handleSpinComplete}
                ownerName={currentSpinner.character_name}
              />

              <button
                onClick={() => setTvState('lobby')}
                className="btn btn-ghost mt-8"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {tvState === 'result' && lastResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center max-w-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className={`
                  w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center text-5xl
                  ${lastResult.landed_on.outcome_type === 'safe' ? 'bg-[#4ecdc4]' : ''}
                  ${lastResult.landed_on.outcome_type === 'mild' ? 'bg-[#ffd700]' : ''}
                  ${lastResult.landed_on.outcome_type === 'spicy' ? 'bg-[#ff6b35]' : ''}
                  ${lastResult.landed_on.outcome_type === 'wild' ? 'bg-[#ff4444]' : ''}
                `}
              >
                {lastResult.landed_on.outcome_type === 'safe' && '✓'}
                {lastResult.landed_on.outcome_type === 'mild' && '🍺'}
                {lastResult.landed_on.outcome_type === 'spicy' && '🌶️'}
                {lastResult.landed_on.outcome_type === 'wild' && '🔥'}
              </motion.div>

              <h2 className="font-display text-4xl font-bold mb-4">
                {lastResult.landed_on.label}
              </h2>
              
              <p className="text-xl text-[var(--color-text-secondary)] mb-8">
                {lastResult.landed_on.description}
              </p>

              <p className="text-sm text-[var(--color-text-muted)] mb-8">
                {currentSpinner.character_name} • Probability: {Math.round(lastResult.landed_on.probability * 100)}%
              </p>

              <button
                onClick={() => {
                  setLastResult(null);
                  setTvState('lobby');
                }}
                className="btn btn-primary"
              >
                Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Story Overlay - Full screen cinematic experience */}
      <StoryOverlay
        story={activeStory}
        onComplete={handleStoryComplete}
        onSkip={handleStoryComplete}
      />

      {/* Sound enable prompt (browsers require user interaction for audio) */}
      {!soundEnabled && tvState === 'lobby' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center"
        >
          <button
            onClick={() => setSoundEnabled(true)}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-xl font-bold transition-colors"
          >
            🔊 Tap to Enable Sound
          </button>
        </motion.div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 p-6 flex justify-between items-center text-sm text-[var(--color-text-muted)]">
        <span>{room.energy_mode} Mode</span>
        
        {/* Dev: Test Story Button */}
        <button
          onClick={triggerTestStory}
          className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded text-xs transition-colors"
        >
          📖 Test Story
        </button>
        
        <span>🦷⟐ 100% Fair</span>
        <span>{room.room_rules}</span>
      </footer>
    </main>
  );
}
