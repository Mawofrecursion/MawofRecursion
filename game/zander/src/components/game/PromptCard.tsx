'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Player, Room } from '@/lib/types';

// =========================
// PROMPT TYPES & STRUCTURES
// =========================

export type PromptType = 
  | 'single_fill'      // One blank to fill
  | 'multi_fill'       // Multiple blanks (each gets its own field)
  | 'open_ended'       // Free text, no blanks
  | 'either_or'        // Choose between two options
  | 'ranking'          // Rank items
  | 'evolution';       // Revisits previous answers

export interface PromptConfig {
  id: string;
  type: PromptType;
  text: string;
  fields: PromptField[];
  tier: number;              // 1-10 spiciness
  minAct: number;            // Earliest act this can appear
  isEvolution?: boolean;     // Does this revisit earlier answers?
  previousPromptId?: string; // If evolution, what prompt did it follow?
}

export interface PromptField {
  id: string;
  placeholder: string;
  label?: string;
  minLength?: number;
  maxLength?: number;
  isOptional?: boolean;
}

// =========================
// SAMPLE PROMPTS BY ACT
// =========================

export const PROMPT_LIBRARY: PromptConfig[] = [
  // =========================
  // ACT 1 - World Establishment (lighter, getting-to-know-you)
  // =========================
  {
    id: 'act1_icebreaker_1',
    type: 'open_ended',
    text: '{character} has a guilty pleasure that nobody in this room knows about...',
    fields: [
      { id: 'answer', placeholder: 'Confess your guilty pleasure...', minLength: 5 }
    ],
    tier: 2,
    minAct: 1,
  },
  {
    id: 'act1_two_truths',
    type: 'multi_fill',
    text: '{character} shares two truths and a lie. The group must guess which is false.',
    fields: [
      { id: 'truth1', placeholder: 'First truth...', label: 'Truth #1' },
      { id: 'truth2', placeholder: 'Second truth...', label: 'Truth #2' },
      { id: 'lie', placeholder: 'Your lie...', label: 'The Lie' },
    ],
    tier: 2,
    minAct: 1,
  },
  {
    id: 'act1_first_impression',
    type: 'open_ended',
    text: '{character}, what was your very first thought when you walked in tonight?',
    fields: [
      { id: 'thought', placeholder: 'Be honest...', minLength: 5 }
    ],
    tier: 1,
    minAct: 1,
  },
  {
    id: 'act1_character_secret',
    type: 'multi_fill',
    text: '{character} has secrets. Share one that\'s safe... and one that\'s less safe.',
    fields: [
      { id: 'safe_secret', placeholder: 'The safe one...', label: 'Safe Secret' },
      { id: 'risky_secret', placeholder: 'The less safe one...', label: 'Risky Secret', isOptional: true },
    ],
    tier: 3,
    minAct: 1,
  },

  // =========================
  // ACT 2 - Complication (things heat up)
  // =========================
  {
    id: 'act2_fantasy_intro',
    type: 'multi_fill',
    text: '{character}\'s secret fantasies...',
    fields: [
      { id: 'fantasy1', placeholder: 'One you can share openly...', label: 'Fantasy #1' },
      { id: 'fantasy2', placeholder: 'One that\'s harder to say...', label: 'Fantasy #2', isOptional: true },
      { id: 'fantasy3', placeholder: 'Go deeper if you dare...', label: 'Fantasy #3', isOptional: true },
    ],
    tier: 5,
    minAct: 2,
  },
  {
    id: 'act2_confession',
    type: 'open_ended',
    text: 'Something {character} has always wanted to say to someone in this room...',
    fields: [
      { id: 'confession', placeholder: 'Your confession...', minLength: 10 }
    ],
    tier: 6,
    minAct: 2,
  },
  {
    id: 'act2_what_if',
    type: 'multi_fill',
    text: '{character} plays "what if" with another character in the room...',
    fields: [
      { id: 'who', placeholder: 'Which character?', label: 'The Character' },
      { id: 'scenario', placeholder: 'What if we...', label: 'The Scenario' },
    ],
    tier: 6,
    minAct: 2,
  },
  {
    id: 'act2_tension',
    type: 'open_ended',
    text: 'There\'s tension in this room. {character}, name it.',
    fields: [
      { id: 'tension', placeholder: 'The tension is...', minLength: 5 }
    ],
    tier: 5,
    minAct: 2,
  },
  {
    id: 'act2_attraction',
    type: 'multi_fill',
    text: '{character}, what draws you to someone in this room? It doesn\'t have to be romantic.',
    fields: [
      { id: 'who', placeholder: 'Who?', label: 'The Person' },
      { id: 'what', placeholder: 'What draws you to them?', label: 'The Draw' },
    ],
    tier: 5,
    minAct: 2,
  },

  // =========================
  // ACT 3 - Escalation (highest tension)
  // =========================
  {
    id: 'act3_evolve_fantasy',
    type: 'evolution',
    text: '{character}, you shared fantasies earlier. Has anything changed? Has something new emerged? Add more if you want.',
    fields: [
      { id: 'evolution', placeholder: 'What\'s changed or intensified...', label: 'The Evolution' },
      { id: 'new_fantasy', placeholder: 'Something entirely new...', label: 'New Fantasy', isOptional: true },
      { id: 'deeper', placeholder: 'Go even deeper...', label: 'The Deeper Truth', isOptional: true },
    ],
    tier: 7,
    minAct: 3,
    isEvolution: true,
    previousPromptId: 'act2_fantasy_intro',
  },
  {
    id: 'act3_dare_design',
    type: 'multi_fill',
    text: '{character} designs a dare for someone else in the room...',
    fields: [
      { id: 'target', placeholder: 'Who is this dare for?', label: 'Target Character' },
      { id: 'dare', placeholder: 'The dare itself...', label: 'The Dare' },
      { id: 'if_declined', placeholder: 'What happens if they decline?', label: 'The Alternative' },
    ],
    tier: 8,
    minAct: 3,
  },
  {
    id: 'act3_unspoken',
    type: 'open_ended',
    text: '{character}, say the thing you\'ve been holding back all night.',
    fields: [
      { id: 'unspoken', placeholder: 'The unspoken thing...', minLength: 5 }
    ],
    tier: 8,
    minAct: 3,
  },
  {
    id: 'act3_proposal',
    type: 'multi_fill',
    text: '{character} makes a proposal to someone in this room...',
    fields: [
      { id: 'to_whom', placeholder: 'To whom?', label: 'The Recipient' },
      { id: 'proposal', placeholder: 'The proposal...', label: 'The Proposal' },
      { id: 'stakes', placeholder: 'What\'s at stake?', label: 'The Stakes', isOptional: true },
    ],
    tier: 9,
    minAct: 3,
  },
  {
    id: 'act3_boundary',
    type: 'multi_fill',
    text: '{character}, name a boundary you\'d consider crossing tonight... and one you won\'t.',
    fields: [
      { id: 'might_cross', placeholder: 'Might cross...', label: 'The Maybe' },
      { id: 'wont_cross', placeholder: 'Absolutely not...', label: 'The Hard No' },
    ],
    tier: 7,
    minAct: 3,
  },

  // =========================
  // ACT 4 - Resolution (wind down, reflection, final reveals)
  // =========================
  {
    id: 'act4_final_fantasy_check',
    type: 'evolution',
    text: '{character}, one last time: your fantasies. Anything you didn\'t get to say? Anything that shifted?',
    fields: [
      { id: 'final_fantasy', placeholder: 'Final fantasy reveal...', label: 'The Final Word' },
      { id: 'what_shifted', placeholder: 'What shifted tonight?', label: 'The Shift', isOptional: true },
    ],
    tier: 6,
    minAct: 4,
    isEvolution: true,
    previousPromptId: 'act3_evolve_fantasy',
  },
  {
    id: 'act4_final_reflection',
    type: 'multi_fill',
    text: '{character} reflects on tonight. What surprised you most?',
    fields: [
      { id: 'surprise', placeholder: 'What surprised you...', label: 'The Surprise' },
      { id: 'wish', placeholder: 'Something you wish had happened...', label: 'The Wish', isOptional: true },
    ],
    tier: 4,
    minAct: 4,
    isEvolution: true,
  },
  {
    id: 'act4_gratitude',
    type: 'open_ended',
    text: '{character}, thank someone in this room for something specific that happened tonight.',
    fields: [
      { id: 'thanks', placeholder: 'Your thanks...', minLength: 10 }
    ],
    tier: 3,
    minAct: 4,
  },
  {
    id: 'act4_next_time',
    type: 'open_ended',
    text: 'If there\'s a next time, {character} wants...',
    fields: [
      { id: 'next_time', placeholder: 'Next time I want...', minLength: 5 }
    ],
    tier: 5,
    minAct: 4,
  },
];

// =========================
// PROMPT CARD COMPONENT
// =========================

interface PromptCardProps {
  prompt: PromptConfig;
  player: Player;
  room: Room;
  previousAnswers?: Record<string, string>;
  onSubmit: (answers: Record<string, string>) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  player,
  room,
  previousAnswers,
  onSubmit,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFocused, setIsFocused] = useState<string | null>(null);

  // Replace {character} with actual character name
  const displayText = prompt.text.replace('{character}', player.character_name || player.real_name);

  const handleFieldChange = (fieldId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const canSubmit = () => {
    return prompt.fields
      .filter(f => !f.isOptional)
      .every(f => {
        const answer = answers[f.id]?.trim() || '';
        const minLen = f.minLength || 1;
        return answer.length >= minLen;
      });
  };

  const handleSubmit = () => {
    if (canSubmit()) {
      onSubmit(answers);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="w-full max-w-lg mx-auto space-y-6"
    >
      {/* Prompt Display */}
      <Card variant="glass" className="p-6">
        <p className="text-xl font-display leading-relaxed text-center">
          {displayText}
        </p>
        
        {/* Show previous answers if this is an evolution prompt */}
        {prompt.isEvolution && previousAnswers && Object.keys(previousAnswers).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-black/30 rounded-lg border border-[var(--color-accent)]/20"
          >
            <p className="text-xs text-[var(--color-text-muted)] mb-2">You previously said:</p>
            {Object.entries(previousAnswers).map(([key, value]) => (
              <p key={key} className="text-sm text-[var(--color-text-secondary)] italic">
                "{value}"
              </p>
            ))}
          </motion.div>
        )}
      </Card>

      {/* Answer Fields */}
      <div className="space-y-4">
        {prompt.fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {field.label && (
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                {field.label}
                {field.isOptional && <span className="text-xs ml-1">(optional)</span>}
              </label>
            )}
            <motion.textarea
              value={answers[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onFocus={() => setIsFocused(field.id)}
              onBlur={() => setIsFocused(null)}
              placeholder={field.placeholder}
              maxLength={field.maxLength || 500}
              rows={3}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-black/40 border-2 transition-all duration-300
                text-[var(--color-text-primary)] placeholder:text-gray-600
                resize-none
                ${isFocused === field.id 
                  ? 'border-[var(--color-accent)] shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                  : 'border-[var(--color-abyss-accent)] hover:border-[var(--color-accent)]/50'
                }
              `}
              animate={{
                scale: isFocused === field.id ? 1.01 : 1,
              }}
            />
            {/* Character count */}
            {field.maxLength && (
              <span className="absolute bottom-2 right-3 text-xs text-gray-600">
                {(answers[field.id] || '').length}/{field.maxLength}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="w-full"
          size="lg"
        >
          {prompt.fields.filter(f => !f.isOptional).length > 1 
            ? 'Submit Answers' 
            : 'Submit'
          }
        </Button>
      </motion.div>

      {/* Tier indicator */}
      <div className="flex justify-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < prompt.tier 
                ? 'bg-gradient-to-r from-[#4ecdc4] via-[#ff6b35] to-[#ff4444]' 
                : 'bg-gray-800'
            }`}
            style={{
              background: i < prompt.tier 
                ? `hsl(${(1 - i / 10) * 180}, 70%, 50%)` 
                : undefined
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// =========================
// PROMPT SELECTOR (picks appropriate prompt for current state)
// =========================

export function selectPromptForState(
  room: Room,
  player: Player,
  answeredPromptIds: string[]
): PromptConfig | null {
  const eligiblePrompts = PROMPT_LIBRARY.filter(p => {
    // Must be appropriate for current act
    if (p.minAct > room.current_act) return false;
    
    // Don't repeat prompts (unless they're evolutions)
    if (!p.isEvolution && answeredPromptIds.includes(p.id)) return false;
    
    // For evolutions, check if we answered the prerequisite
    if (p.isEvolution && p.previousPromptId) {
      if (!answeredPromptIds.includes(p.previousPromptId)) return false;
    }
    
    // Tier should roughly match heat level
    const tierDiff = Math.abs(p.tier - room.heat_level);
    if (tierDiff > 3) return false;
    
    return true;
  });

  if (eligiblePrompts.length === 0) return null;
  
  // Weight by how close the tier is to heat level
  const weighted = eligiblePrompts.map(p => ({
    prompt: p,
    weight: 10 - Math.abs(p.tier - room.heat_level),
  }));
  
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) return w.prompt;
  }
  
  return weighted[0]?.prompt || null;
}

