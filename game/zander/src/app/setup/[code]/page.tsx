'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ProfileSetup, 
  RelationshipMapper, 
  PersonalityQuiz, 
  GroupVoting, 
  QuestionSubmit 
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { 
  Player, 
  Gender, 
  RealRelationship, 
  PersonalityResult,
  GroupVote,
  UserSubmittedQuestion,
  OnboardingPhase
} from '@/lib/types';
import { v4 as uuid } from 'uuid';

// Mock other players (in real app, this comes from Supabase realtime)
const MOCK_OTHER_PLAYERS: Player[] = [
  {
    id: '2',
    room_id: '1',
    real_name: 'Lauren',
    gender: 'female',
    character_name: 'The Starlet',
    relationships: [],
    character_relationships: {},
    profile: { competitive_collaborative: 0.5, reserved_expressive: 0.5, observer_instigator: 0.5, fantasy_realism: 0.5, verbal_physical: 0.5, humor_tolerance: 0.5, risk_appetite: 0.5, spotlight_comfort: 0.5, hard_limits: [] },
    onboarding_complete: false,
    current_onboarding_phase: 'profile',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.5,
    instigator_points: 0,
    personal_wheel: { player_id: '2', slices: [], total_spins: 0, spin_history: [] },
    joined_at: new Date().toISOString(),
  },
  {
    id: '3',
    room_id: '1',
    real_name: 'Liz',
    gender: 'female',
    character_name: 'The Siren',
    relationships: [],
    character_relationships: {},
    profile: { competitive_collaborative: 0.5, reserved_expressive: 0.5, observer_instigator: 0.5, fantasy_realism: 0.5, verbal_physical: 0.5, humor_tolerance: 0.5, risk_appetite: 0.5, spotlight_comfort: 0.5, hard_limits: [] },
    onboarding_complete: false,
    current_onboarding_phase: 'profile',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.5,
    instigator_points: 0,
    personal_wheel: { player_id: '3', slices: [], total_spins: 0, spin_history: [] },
    joined_at: new Date().toISOString(),
  },
  {
    id: '4',
    room_id: '1',
    real_name: 'Mike',
    gender: 'male',
    character_name: 'The Enforcer',
    relationships: [],
    character_relationships: {},
    profile: { competitive_collaborative: 0.5, reserved_expressive: 0.5, observer_instigator: 0.5, fantasy_realism: 0.5, verbal_physical: 0.5, humor_tolerance: 0.5, risk_appetite: 0.5, spotlight_comfort: 0.5, hard_limits: [] },
    onboarding_complete: false,
    current_onboarding_phase: 'profile',
    role: 'PLAYER',
    is_active: true,
    comfort_signal: 0.5,
    engagement_score: 0.5,
    instigator_points: 0,
    personal_wheel: { player_id: '4', slices: [], total_spins: 0, spin_history: [] },
    joined_at: new Date().toISOString(),
  },
];

type SetupPhase = 
  | 'waiting'       // Waiting for others to join
  | 'profile'       // Name, character name, gender
  | 'waiting_profiles' // Waiting for others to finish profiles
  | 'relationships' // Who are you with?
  | 'waiting_relationships'
  | 'personality'   // 10 questions
  | 'waiting_personality'
  | 'group_voting'  // Who is most X?
  | 'waiting_voting'
  | 'questions'     // Submit your own questions
  | 'waiting_questions'
  | 'ready'         // Everyone done, about to start
  | 'starting';     // Countdown to game start

export default function SetupPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  // Current player state
  const [currentPlayer, setCurrentPlayer] = useState<Partial<Player>>({
    id: uuid(),
    room_id: '1',
  });

  // All players
  const [allPlayers, setAllPlayers] = useState<Player[]>(MOCK_OTHER_PLAYERS);

  // Phase
  const [phase, setPhase] = useState<SetupPhase>('profile');

  // Collected data
  const [relationships, setRelationships] = useState<RealRelationship[]>([]);
  const [personality, setPersonality] = useState<PersonalityResult | null>(null);
  const [votes, setVotes] = useState<GroupVote[]>([]);
  const [submittedQuestions, setSubmittedQuestions] = useState<UserSubmittedQuestion[]>([]);

  // Handle profile completion
  const handleProfileComplete = (data: { realName: string; characterName: string; gender: Gender }) => {
    const updatedPlayer: Partial<Player> = {
      ...currentPlayer,
      real_name: data.realName,
      character_name: data.characterName,
      gender: data.gender,
    };
    setCurrentPlayer(updatedPlayer);
    
    // In real app: save to Supabase, then wait for others
    // For now, go straight to relationships
    setPhase('relationships');
  };

  // Handle relationships completion
  const handleRelationshipsComplete = (rels: RealRelationship[]) => {
    setRelationships(rels);
    setCurrentPlayer(prev => ({ ...prev, relationships: rels }));
    setPhase('personality');
  };

  // Handle personality completion
  const handlePersonalityComplete = (result: PersonalityResult) => {
    setPersonality(result);
    setCurrentPlayer(prev => ({
      ...prev,
      profile: { ...prev.profile!, personality: result },
    }));
    setPhase('group_voting');
  };

  // Handle voting completion
  const handleVotingComplete = (newVotes: GroupVote[]) => {
    setVotes(newVotes);
    setPhase('questions');
  };

  // Handle questions completion
  const handleQuestionsComplete = (questions: UserSubmittedQuestion[]) => {
    setSubmittedQuestions(questions);
    setPhase('ready');
  };

  // Start the game
  const handleStartGame = () => {
    setPhase('starting');
    setTimeout(() => {
      router.push(`/play/${code}`);
    }, 3000);
  };

  // Render waiting screen
  const WaitingScreen = ({ message, playersReady, totalPlayers }: { 
    message: string; 
    playersReady: number; 
    totalPlayers: number; 
  }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Card variant="glass" className="p-8 text-center max-w-md">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-6 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <h2 className="text-xl font-bold mb-2">{message}</h2>
        <p className="text-gray-400 mb-4">
          {playersReady} of {totalPlayers} players ready
        </p>
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPlayers }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < playersReady ? 'bg-green-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Room code header */}
      <div className="fixed top-4 left-4 z-50">
        <span className="text-xs text-gray-500">Room</span>
        <p className="font-mono text-lg">{code}</p>
      </div>

      {/* Phase indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex gap-1">
          {['profile', 'relationships', 'personality', 'group_voting', 'questions', 'ready'].map((p, i) => (
            <div
              key={p}
              className={`w-2 h-2 rounded-full transition-colors ${
                phase === p || ['profile', 'relationships', 'personality', 'group_voting', 'questions', 'ready'].indexOf(phase.replace('waiting_', '')) > i
                  ? 'bg-purple-500'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Profile Setup */}
        {phase === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileSetup onComplete={handleProfileComplete} />
          </motion.div>
        )}

        {/* Relationship Mapping */}
        {phase === 'relationships' && currentPlayer.real_name && currentPlayer.character_name && currentPlayer.gender && (
          <motion.div key="relationships" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RelationshipMapper
              currentPlayer={currentPlayer as Player}
              otherPlayers={allPlayers}
              onComplete={handleRelationshipsComplete}
            />
          </motion.div>
        )}

        {/* Personality Quiz */}
        {phase === 'personality' && (
          <motion.div key="personality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PersonalityQuiz onComplete={handlePersonalityComplete} />
          </motion.div>
        )}

        {/* Group Voting */}
        {phase === 'group_voting' && currentPlayer.real_name && (
          <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GroupVoting
              currentPlayer={currentPlayer as Player}
              allPlayers={[currentPlayer as Player, ...allPlayers]}
              onComplete={handleVotingComplete}
            />
          </motion.div>
        )}

        {/* Question Submission */}
        {phase === 'questions' && currentPlayer.id && (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuestionSubmit
              currentPlayer={currentPlayer as Player}
              roomId="1"
              onComplete={handleQuestionsComplete}
              minQuestions={0}
              maxQuestions={5}
            />
          </motion.div>
        )}

        {/* Ready Screen */}
        {phase === 'ready' && (
          <motion.div 
            key="ready" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >
            <Card variant="secret" className="p-8 text-center max-w-md">
              <motion.span
                className="text-6xl block mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ✨
              </motion.span>
              <h2 className="text-2xl font-bold mb-2">You're Ready!</h2>
              <p className="text-gray-400 mb-6">
                Setup complete. Here's your summary:
              </p>
              
              {/* Summary */}
              <div className="text-left space-y-3 mb-6 bg-black/30 rounded-lg p-4">
                <div>
                  <span className="text-xs text-gray-500">Playing as</span>
                  <p className="font-bold">{currentPlayer.real_name} ({currentPlayer.character_name})</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Questions submitted</span>
                  <p className="font-bold">{submittedQuestions.length}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Profile</span>
                  <p className="font-bold text-green-400">✓ Complete</p>
                </div>
              </div>

              <Button onClick={handleStartGame} size="lg" className="w-full">
                Start Game 🎮
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Starting countdown */}
        {phase === 'starting' && (
          <motion.div 
            key="starting" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-center"
            >
              <motion.span
                className="text-8xl block mb-8"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                🎰
              </motion.span>
              <h1 className="text-4xl font-bold mb-4">Game Starting...</h1>
              <p className="text-gray-400">Get ready to play</p>
            </motion.div>
          </motion.div>
        )}

        {/* Waiting states */}
        {phase === 'waiting_profiles' && (
          <WaitingScreen message="Waiting for others to finish their profiles..." playersReady={2} totalPlayers={4} />
        )}
        {phase === 'waiting_relationships' && (
          <WaitingScreen message="Waiting for relationship mapping..." playersReady={1} totalPlayers={4} />
        )}
        {phase === 'waiting_personality' && (
          <WaitingScreen message="Waiting for personality quizzes..." playersReady={3} totalPlayers={4} />
        )}
        {phase === 'waiting_voting' && (
          <WaitingScreen message="Waiting for group votes..." playersReady={2} totalPlayers={4} />
        )}
        {phase === 'waiting_questions' && (
          <WaitingScreen message="Waiting for question submissions..." playersReady={3} totalPlayers={4} />
        )}
      </AnimatePresence>
    </main>
  );
}

