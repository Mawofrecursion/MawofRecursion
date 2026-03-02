'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Player, GroupVote } from '@/lib/types';

interface GroupVotingProps {
  currentPlayer: Player;
  allPlayers: Player[];
  onComplete: (votes: GroupVote[]) => void;
}

// The "who is most X?" questions
const VOTING_QUESTIONS = [
  // Public questions - results shared
  {
    id: 'prude',
    text: 'Who is the most PRUDE person in this group?',
    emoji: '😇',
    showResults: true,
    allowSelfVote: true,
    tier: 3,
  },
  {
    id: 'drunk',
    text: 'Who is the LEAST likely to get drunk tonight?',
    emoji: '🍺',
    showResults: true,
    allowSelfVote: true,
    tier: 2,
  },
  {
    id: 'responsible',
    text: 'Who is the most RESPONSIBLE person here?',
    emoji: '📋',
    showResults: true,
    allowSelfVote: true,
    tier: 2,
  },
  {
    id: 'chef',
    text: 'Someone is cooking dinner tonight - who would you pick?',
    emoji: '👨‍🍳',
    showResults: true,
    allowSelfVote: true,
    tier: 1,
  },
  {
    id: 'loudmouth',
    text: 'Who has the LOUDEST mouth in this game right now?',
    emoji: '📢',
    showResults: true,
    allowSelfVote: true,
    tier: 2,
  },
  {
    id: 'body_burial',
    text: 'If they came to you with blood on their hands and asked for help... would you help them bury the body?',
    emoji: '🩸',
    showResults: false, // Private - just affects the game AI
    allowSelfVote: false,
    tier: 5,
    subtext: 'Pick who you\'d help no questions asked',
  },
  {
    id: 'trouble',
    text: 'Who is most likely to get everyone in TROUBLE tonight?',
    emoji: '😈',
    showResults: true,
    allowSelfVote: true,
    tier: 3,
  },
  {
    id: 'secrets',
    text: 'Who in this room is DEFINITELY hiding something?',
    emoji: '🤫',
    showResults: true,
    allowSelfVote: true,
    tier: 4,
  },
  {
    id: 'flirt',
    text: 'Who is the biggest FLIRT in this group?',
    emoji: '😏',
    showResults: true,
    allowSelfVote: true,
    tier: 4,
  },
  // The private spicy one - LAST
  {
    id: 'sexiest',
    text: 'PRIVATE: Who is the SEXIEST person playing this game right now?',
    emoji: '🔥',
    showResults: false, // NEVER shared with the group
    allowSelfVote: true, // Can vote for yourself
    tier: 7,
    subtext: 'This is 100% private. Nobody will ever know who you picked.',
    isPrivate: true,
  },
];

export const GroupVoting: React.FC<GroupVotingProps> = ({
  currentPlayer,
  allPlayers,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<GroupVote[]>([]);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  const currentQuestion = VOTING_QUESTIONS[currentIndex];
  const progress = (currentIndex / VOTING_QUESTIONS.length) * 100;

  // Filter players for voting (may exclude self)
  const votablePlayers = currentQuestion.allowSelfVote
    ? allPlayers
    : allPlayers.filter(p => p.id !== currentPlayer.id);

  const handleVote = (votedForId: string) => {
    const vote: GroupVote = {
      question_id: currentQuestion.id,
      voter_id: currentPlayer.id,
      voted_for: votedForId,
      created_at: new Date().toISOString(),
    };

    const newVotes = [...votes, vote];
    setVotes(newVotes);

    if (currentIndex < VOTING_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(newVotes);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg"
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Group Questions</span>
            <span>{currentIndex + 1} of {VOTING_QUESTIONS.length}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-red-500"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Question Card */}
            <Card 
              variant={currentQuestion.isPrivate ? 'secret' : 'glass'} 
              className="p-6 text-center"
            >
              <motion.span 
                className="text-5xl block mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {currentQuestion.emoji}
              </motion.span>
              <h2 className="text-xl font-bold leading-relaxed">
                {currentQuestion.text}
              </h2>
              {currentQuestion.subtext && (
                <p className="text-sm text-gray-400 mt-2">
                  {currentQuestion.subtext}
                </p>
              )}
              {currentQuestion.isPrivate && (
                <div className="mt-4 p-2 bg-black/40 rounded-lg">
                  <p className="text-xs text-purple-400">
                    🔒 100% PRIVATE - No one will ever see this answer
                  </p>
                </div>
              )}
            </Card>

            {/* Player Options */}
            <div className="grid grid-cols-2 gap-3">
              {votablePlayers.map((player, index) => (
                <motion.button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  onHoverStart={() => setHoveredPlayer(player.id)}
                  onHoverEnd={() => setHoveredPlayer(null)}
                  className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden
                    ${player.id === currentPlayer.id 
                      ? 'border-yellow-500/50 bg-yellow-500/10' 
                      : 'border-gray-700 hover:border-pink-500 bg-black/30 hover:bg-pink-500/10'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Avatar */}
                  <div className={`w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl
                    ${player.id === currentPlayer.id 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                      : 'bg-gradient-to-br from-purple-600 to-pink-600'
                    }`}
                  >
                    {player.real_name[0].toUpperCase()}
                  </div>
                  
                  {/* Names */}
                  <p className="font-bold text-sm">{player.real_name}</p>
                  <p className="text-xs text-purple-400">({player.character_name})</p>
                  
                  {/* Self indicator */}
                  {player.id === currentPlayer.id && (
                    <span className="absolute top-2 right-2 text-xs bg-yellow-500/30 px-2 py-0.5 rounded">
                      You
                    </span>
                  )}

                  {/* Hover effect */}
                  {hoveredPlayer === player.id && (
                    <motion.div
                      layoutId="hover-glow"
                      className="absolute inset-0 border-2 border-pink-500 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Back button */}
            {currentIndex > 0 && (
              <Button 
                variant="ghost" 
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="w-full"
              >
                ← Go back
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Results note */}
        <p className="text-xs text-gray-600 text-center mt-8">
          {currentQuestion.showResults 
            ? '👀 Everyone will see the results of this vote'
            : '🔒 This vote is private and won\'t be shared'
          }
        </p>
      </motion.div>
    </div>
  );
};

