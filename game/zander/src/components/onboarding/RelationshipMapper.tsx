'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Player, RealRelationship, RelationshipType } from '@/lib/types';

interface RelationshipMapperProps {
  currentPlayer: Player;
  otherPlayers: Player[];
  onComplete: (relationships: RealRelationship[]) => void;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; emoji: string; description: string }[] = [
  { value: 'married', label: 'Married', emoji: '💍', description: 'We are married' },
  { value: 'engaged', label: 'Engaged', emoji: '💎', description: 'We are engaged' },
  { value: 'dating', label: 'Dating', emoji: '❤️', description: 'We are dating' },
  { value: 'ex', label: 'Ex', emoji: '💔', description: 'We used to date' },
  { value: 'friend', label: 'Friend', emoji: '🤝', description: 'We are friends' },
  { value: 'acquaintance', label: 'Acquaintance', emoji: '👋', description: 'We just met / know each other' },
  { value: 'stranger', label: 'Stranger', emoji: '❓', description: "I don't know them" },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧', description: 'We are related' },
];

export const RelationshipMapper: React.FC<RelationshipMapperProps> = ({
  currentPlayer,
  otherPlayers,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [relationships, setRelationships] = useState<RealRelationship[]>([]);
  const [comfortLevel, setComfortLevel] = useState(5);

  const currentOther = otherPlayers[currentIndex];

  const handleSelectRelationship = (type: RelationshipType) => {
    const relationship: RealRelationship = {
      player_id: currentOther.id,
      relationship: type,
      comfort_level: comfortLevel,
    };

    const newRelationships = [...relationships, relationship];
    setRelationships(newRelationships);

    if (currentIndex < otherPlayers.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setComfortLevel(5); // Reset comfort for next person
    } else {
      onComplete(newRelationships);
    }
  };

  const progress = ((currentIndex) / otherPlayers.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Mapping relationships</span>
            <span>{currentIndex + 1} of {otherPlayers.length}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentOther.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="space-y-6"
          >
            {/* The person being asked about */}
            <Card variant="glass" className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl">
                {currentOther.real_name[0].toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold">
                {currentOther.real_name}
                <span className="text-purple-400 text-lg ml-2">({currentOther.character_name})</span>
              </h2>
              <p className="text-gray-400 mt-2">What is your relationship to this person?</p>
            </Card>

            {/* Relationship options */}
            <div className="grid grid-cols-2 gap-3">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelectRelationship(option.value)}
                  className="p-4 rounded-xl border-2 border-gray-700 hover:border-purple-500 
                             bg-black/30 hover:bg-purple-500/10 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <p className="font-bold mt-1">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </motion.button>
              ))}
            </div>

            {/* Comfort slider - shows only for romantic/close relationships */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-black/20 rounded-xl"
            >
              <p className="text-sm text-gray-400 mb-3">
                How comfortable are you with physical proximity to {currentOther.real_name}?
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">None</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={comfortLevel}
                  onChange={(e) => setComfortLevel(parseInt(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-xs text-gray-500">Very</span>
              </div>
              <p className="text-center text-sm mt-2 text-purple-400">{comfortLevel}/10</p>
            </motion.div>

            {/* Why this matters */}
            <p className="text-xs text-gray-600 text-center">
              🔒 This is private and helps the game only pair couples for intimate prompts early on.
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

