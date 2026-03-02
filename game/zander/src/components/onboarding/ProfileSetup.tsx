'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Gender } from '@/lib/types';

interface ProfileSetupProps {
  onComplete: (data: { realName: string; characterName: string; gender: Gender }) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [realName, setRealName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [step, setStep] = useState<'name' | 'character' | 'gender'>('name');

  const handleSubmit = () => {
    if (realName && characterName && gender) {
      onComplete({ realName, characterName, gender });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {['name', 'character', 'gender'].map((s, i) => (
            <motion.div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                step === s ? 'bg-purple-500' : 
                ['name', 'character', 'gender'].indexOf(step) > i ? 'bg-purple-500/50' : 'bg-gray-700'
              }`}
              animate={step === s ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          ))}
        </div>

        {/* Step 1: Real Name */}
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <Card variant="glass" className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">What's your name?</h2>
              <p className="text-gray-400 text-sm">Your real first name. This helps others know who you are.</p>
            </Card>
            
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="Your first name..."
              className="w-full px-6 py-4 text-xl text-center bg-black/40 border-2 border-gray-700 rounded-xl
                         focus:border-purple-500 focus:outline-none transition-colors"
              autoFocus
            />
            
            <Button 
              onClick={() => setStep('character')} 
              disabled={!realName.trim()}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Character Name */}
        {step === 'character' && (
          <motion.div
            key="character"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <Card variant="glass" className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Pick a character name</h2>
              <p className="text-gray-400 text-sm">
                This is your alias tonight. Could be a persona, a nickname, or something fun.
              </p>
            </Card>
            
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Your character name..."
              className="w-full px-6 py-4 text-xl text-center bg-black/40 border-2 border-gray-700 rounded-xl
                         focus:border-purple-500 focus:outline-none transition-colors"
              autoFocus
            />
            
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['The Detective', 'The Stranger', 'Wildcard', 'The Quiet One', realName + ' 2.0'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setCharacterName(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('name')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep('gender')} 
                disabled={!characterName.trim()}
                className="flex-1"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Gender */}
        {step === 'gender' && (
          <motion.div
            key="gender"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <Card variant="glass" className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">How do you identify?</h2>
              <p className="text-gray-400 text-sm">
                This helps tailor prompts and ensure comfort for everyone.
              </p>
            </Card>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'male', label: 'Male', emoji: '👨' },
                { value: 'female', label: 'Female', emoji: '👩' },
                { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say', emoji: '🤫' },
              ].map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => setGender(option.value as Gender)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    gender === option.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl mb-1 block">{option.emoji}</span>
                  <span className="text-sm">{option.label}</span>
                </motion.button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('character')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!gender}
                className="flex-1"
                size="lg"
              >
                Done
              </Button>
            </div>
            
            {/* Preview */}
            {realName && characterName && gender && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-black/30 rounded-lg text-center"
              >
                <p className="text-gray-400 text-sm">You'll appear as:</p>
                <p className="text-lg font-bold">
                  {realName} <span className="text-purple-400">({characterName})</span>
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

