'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SecretCard } from '@/components/game/SecretCard';
import { PullWheel } from '@/components/game/PullWheel';
import { PromptCard, selectPromptForState, type PromptConfig } from '@/components/game/PromptCard';
import { SecretWhisper, WhisperNotification, type Whisper } from '@/components/game/SecretWhisper';
import { MOCK_ROOM, MOCK_PLAYERS } from '@/lib/mock-data';
import type { Room, GameEvent, SpinResult } from '@/lib/types';

// =========================
// PHONE CONTROLLER
// Your personal remote control
// =========================

type ViewState = 'home' | 'prompt' | 'voting' | 'secret' | 'wheel' | 'dice' | 'draw' | 'tunnel' | 'result';

export default function PlayPage() {
  const params = useParams();
  const code = params.code as string;

  // State
  const [room, setRoom] = useState<Room>(MOCK_ROOM);
  const [currentPlayer] = useState(MOCK_PLAYERS[0]);
  const [viewState, setViewState] = useState<ViewState>('home');
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [lastSpinResult, setLastSpinResult] = useState<SpinResult | null>(null);
  
  // Prompt system
  const [answeredPromptIds, setAnsweredPromptIds] = useState<string[]>([]);
  const [previousAnswers, setPreviousAnswers] = useState<Record<string, Record<string, string>>>({});
  const [currentPrompt, setCurrentPrompt] = useState<PromptConfig | null>(null);
  
  // Whisper system
  const [activeWhisper, setActiveWhisper] = useState<Whisper | null>(null);
  const [hasUnreadWhisper, setHasUnreadWhisper] = useState(false);
  
  // Dice
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Simulate receiving a whisper (in real app, this comes from Supabase)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Demo whisper after 10 seconds
      if (!activeWhisper) {
        setActiveWhisper({
          id: 'demo_whisper',
          type: 'hint',
          message: `Hey ${currentPlayer.character_name}, notice how quiet things have been? Maybe stir something up...`,
          created_at: new Date().toISOString(),
        });
        setHasUnreadWhisper(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [currentPlayer.character_name, activeWhisper]);

  // Prompt handling
  const handlePromptSubmit = (answers: Record<string, string>) => {
    if (!currentPrompt) return;
    setPreviousAnswers(prev => ({ ...prev, [currentPrompt.id]: answers }));
    setAnsweredPromptIds(prev => [...prev, currentPrompt.id]);
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        room_id: room.id,
        round_number: room.current_round,
        act_number: room.current_act,
        event_type: 'PROMPT',
        content: Object.values(answers).join(' | '),
        metadata: { player_id: currentPlayer.id, prompt_id: currentPrompt.id, answers },
        created_at: new Date().toISOString(),
      },
    ]);
    setCurrentPrompt(null);
    setViewState('home');
  };

  // Secret task handling
  const handleSecretComplete = (claimed: boolean) => {
    console.log('Secret task:', claimed ? 'completed' : 'alternate taken');
    setViewState('home');
  };

  // Wheel spin handling
  const handleSpinComplete = (result: SpinResult) => {
    setLastSpinResult(result);
    setViewState('result');
  };

  // Dice roll
  const rollDice = () => {
    setIsRolling(true);
    setDiceResult(null);
    
    // Animate for 1.5 seconds then land
    setTimeout(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      setIsRolling(false);
    }, 1500);
  };

  // Whisper handling
  const handleWhisperDismiss = () => {
    setActiveWhisper(null);
    setHasUnreadWhisper(false);
  };

  const handleMissionComplete = (completed: boolean) => {
    console.log('Mission:', completed ? 'completed' : 'skipped');
    setActiveWhisper(null);
    setHasUnreadWhisper(false);
    // In real app: send to server for scoring
  };

  // Request a prompt
  const requestPrompt = () => {
    const prompt = selectPromptForState(room, currentPlayer, answeredPromptIds);
    if (prompt) {
      setCurrentPrompt(prompt);
      setViewState('prompt');
    }
  };

  // Request a whisper (for testing)
  const requestWhisper = async () => {
    try {
      const response = await fetch('/api/whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: currentPlayer.real_name,
          player_character: currentPlayer.character_name,
          whisper_type: ['mission', 'hint', 'dare', 'instigate'][Math.floor(Math.random() * 4)],
          context: `Act ${room.current_act}, heat level ${room.heat_level}`,
          other_players: MOCK_PLAYERS.filter(p => p.id !== currentPlayer.id).map(p => p.character_name),
          room_heat: room.heat_level,
        }),
      });
      const whisper = await response.json();
      setActiveWhisper(whisper);
      setHasUnreadWhisper(true);
    } catch (error) {
      console.error('Failed to get whisper:', error);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 to-black" data-energy={room.energy_mode}>
      {/* Header - Always visible */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Room {code}</p>
            <p className="font-bold text-purple-400">{currentPlayer.character_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Act {room.current_act}</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-3 rounded-sm ${
                    i < room.heat_level 
                      ? 'bg-gradient-to-t from-orange-500 to-red-500' 
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-24">
        <AnimatePresence mode="wait">
          {/* HOME - Quick Actions */}
          {viewState === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Status Card */}
              <Card variant="glass" className="p-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-4xl mb-2"
                >
                  {room.current_act === 1 ? '🌅' : room.current_act === 2 ? '🌆' : room.current_act === 3 ? '🌙' : '✨'}
                </motion.div>
                <p className="text-gray-400">Waiting for the next moment...</p>
                <p className="text-xs text-gray-600 mt-1">Watch the TV for instructions</p>
              </Card>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setViewState('wheel')}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl block mb-1">🎰</span>
                  <span className="text-sm font-medium">Spin Wheel</span>
                </motion.button>

                <motion.button
                  onClick={() => setViewState('dice')}
                  className="p-4 rounded-xl bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl block mb-1">🎲</span>
                  <span className="text-sm font-medium">Roll Dice</span>
                </motion.button>

                <motion.button
                  onClick={requestPrompt}
                  className="p-4 rounded-xl bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl block mb-1">✍️</span>
                  <span className="text-sm font-medium">Answer</span>
                </motion.button>

                <motion.button
                  onClick={() => setViewState('tunnel')}
                  className="p-4 rounded-xl bg-gradient-to-br from-red-900/50 to-orange-900/50 border border-red-500/30"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl block mb-1">🤫</span>
                  <span className="text-sm font-medium">Tunnel</span>
                </motion.button>
              </div>

              {/* Dev Controls */}
              <div className="p-3 border border-dashed border-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Dev Controls</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setViewState('secret')}>
                    Secret Task
                  </Button>
                  <Button size="sm" variant="ghost" onClick={requestWhisper}>
                    Get Whisper
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setRoom(prev => ({ ...prev, heat_level: Math.min(10, prev.heat_level + 1) }))}
                  >
                    Heat +
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setRoom(prev => ({ ...prev, current_act: Math.min(4, prev.current_act + 1) }))}
                  >
                    Act +
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROMPT - Answer a question */}
          {viewState === 'prompt' && currentPrompt && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Button variant="ghost" onClick={() => setViewState('home')} className="mb-4">
                ← Back
              </Button>
              <PromptCard
                prompt={currentPrompt}
                player={currentPlayer}
                room={room}
                previousAnswers={currentPrompt.previousPromptId ? previousAnswers[currentPrompt.previousPromptId] : undefined}
                onSubmit={handlePromptSubmit}
              />
            </motion.div>
          )}

          {/* WHEEL - Spin your personal wheel */}
          {viewState === 'wheel' && (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Button variant="ghost" onClick={() => setViewState('home')} className="mb-4">
                ← Back
              </Button>
              <h2 className="text-xl font-bold mb-2">Your Wheel</h2>
              <p className="text-gray-500 text-sm mb-6">Pull down and release to spin</p>
              <PullWheel
                slices={currentPlayer.personal_wheel.slices}
                onSpinComplete={handleSpinComplete}
                ownerName={currentPlayer.character_name}
              />
            </motion.div>
          )}

          {/* DICE - Roll the dice */}
          {viewState === 'dice' && (
            <motion.div
              key="dice"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6"
            >
              <Button variant="ghost" onClick={() => setViewState('home')} className="mb-4">
                ← Back
              </Button>
              <h2 className="text-xl font-bold">Roll the Dice</h2>
              
              {/* Dice Display */}
              <motion.div
                className="w-32 h-32 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-xl"
                animate={isRolling ? {
                  rotate: [0, 90, 180, 270, 360],
                  scale: [1, 1.1, 1, 1.1, 1],
                } : {}}
                transition={{ repeat: isRolling ? Infinity : 0, duration: 0.3 }}
              >
                <span className="text-6xl text-black font-bold">
                  {isRolling ? '?' : diceResult || '🎲'}
                </span>
              </motion.div>

              {diceResult && !isRolling && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold"
                >
                  You rolled a <span className="text-yellow-400">{diceResult}</span>!
                </motion.p>
              )}

              <Button onClick={rollDice} disabled={isRolling} size="lg" className="w-full max-w-xs">
                {isRolling ? 'Rolling...' : 'Roll!'}
              </Button>
            </motion.div>
          )}

          {/* SECRET - Secret task */}
          {viewState === 'secret' && (
            <motion.div
              key="secret"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button variant="ghost" onClick={() => setViewState('home')} className="mb-4">
                ← Back
              </Button>
              <SecretCard
                task="Make The Starlet laugh within 90 seconds without telling them why."
                timeLimit={90}
                targetCharacter="The Starlet"
                onComplete={handleSecretComplete}
              />
            </motion.div>
          )}

          {/* TUNNEL - Private messaging */}
          {viewState === 'tunnel' && (
            <motion.div
              key="tunnel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Button variant="ghost" onClick={() => setViewState('home')} className="mb-4">
                ← Back
              </Button>
              <Card variant="secret" className="p-6 text-center">
                <span className="text-4xl block mb-4">🤫</span>
                <h2 className="text-xl font-bold mb-2">Private Tunnel</h2>
                <p className="text-gray-400 mb-6">Select someone to message privately</p>
                
                <div className="space-y-2">
                  {MOCK_PLAYERS.filter(p => p.id !== currentPlayer.id).map((player) => (
                    <button
                      key={player.id}
                      className="w-full p-3 rounded-lg bg-black/40 hover:bg-purple-900/40 border border-gray-800 hover:border-purple-500/50 transition-all text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold">
                        {player.real_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{player.character_name}</p>
                        <p className="text-xs text-gray-500">{player.real_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* RESULT - Show spin/dice result */}
          {viewState === 'result' && lastSpinResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl
                  ${lastSpinResult.landed_on.outcome_type === 'safe' ? 'bg-emerald-500' : ''}
                  ${lastSpinResult.landed_on.outcome_type === 'mild' ? 'bg-yellow-500' : ''}
                  ${lastSpinResult.landed_on.outcome_type === 'spicy' ? 'bg-orange-500' : ''}
                  ${lastSpinResult.landed_on.outcome_type === 'wild' ? 'bg-red-500' : ''}
                `}
              >
                {lastSpinResult.landed_on.outcome_type === 'safe' && '✓'}
                {lastSpinResult.landed_on.outcome_type === 'mild' && '🍺'}
                {lastSpinResult.landed_on.outcome_type === 'spicy' && '🌶️'}
                {lastSpinResult.landed_on.outcome_type === 'wild' && '🔥'}
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">{lastSpinResult.landed_on.label}</h2>
              <p className="text-gray-400 mb-6">{lastSpinResult.landed_on.description}</p>

              <Button onClick={() => { setLastSpinResult(null); setViewState('home'); }} size="lg">
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav - Always visible */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 p-2 z-20">
        <div className="flex justify-around">
          <button
            onClick={() => setViewState('home')}
            className={`p-3 rounded-lg transition-colors ${viewState === 'home' ? 'bg-purple-900/50 text-purple-400' : 'text-gray-500'}`}
          >
            <span className="text-xl block">🏠</span>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => setViewState('wheel')}
            className={`p-3 rounded-lg transition-colors ${viewState === 'wheel' ? 'bg-purple-900/50 text-purple-400' : 'text-gray-500'}`}
          >
            <span className="text-xl block">🎰</span>
            <span className="text-xs">Wheel</span>
          </button>
          <button
            onClick={requestPrompt}
            className={`p-3 rounded-lg transition-colors ${viewState === 'prompt' ? 'bg-purple-900/50 text-purple-400' : 'text-gray-500'}`}
          >
            <span className="text-xl block">✍️</span>
            <span className="text-xs">Answer</span>
          </button>
          <button
            onClick={() => setViewState('tunnel')}
            className={`p-3 rounded-lg transition-colors ${viewState === 'tunnel' ? 'bg-purple-900/50 text-purple-400' : 'text-gray-500'}`}
          >
            <span className="text-xl block">🤫</span>
            <span className="text-xs">Tunnel</span>
          </button>
        </div>
      </nav>

      {/* Secret Whisper Overlay */}
      {activeWhisper && (
        <SecretWhisper
          whisper={activeWhisper}
          onDismiss={handleWhisperDismiss}
          onMissionComplete={activeWhisper.type === 'mission' ? handleMissionComplete : undefined}
        />
      )}

      {/* Whisper notification dot */}
      <WhisperNotification
        hasUnread={hasUnreadWhisper && !activeWhisper}
        onClick={() => setHasUnreadWhisper(false)}
      />
    </main>
  );
}
