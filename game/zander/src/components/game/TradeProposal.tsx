'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { WheelSlice, Player } from '@/lib/types';
import { formatProbability } from '@/lib/engine/fair-spin';

interface TradeProposalProps {
  // Who is proposing
  proposers: Player[];
  
  // Who is the target
  targetPlayer: Player;
  
  // Callback when proposal is submitted
  onSubmit: (proposal: {
    targetPlayerId: string;
    slice: Omit<WheelSlice, 'id' | 'added_by' | 'accepted_at' | 'trade_id'>;
  }) => void;
  
  onCancel: () => void;
}

const OUTCOME_TYPES: { value: WheelSlice['outcome_type']; label: string; emoji: string }[] = [
  { value: 'mild', label: 'Mild', emoji: '😊' },
  { value: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { value: 'wild', label: 'Wild', emoji: '🔥' },
];

const PROBABILITY_OPTIONS = [
  { value: 0.05, label: '5%', odds: '1 in 20' },
  { value: 0.10, label: '10%', odds: '1 in 10' },
  { value: 0.15, label: '15%', odds: '1 in 7' },
  { value: 0.20, label: '20%', odds: '1 in 5' },
  { value: 0.25, label: '25%', odds: '1 in 4' },
];

export function TradeProposal({ proposers, targetPlayer, onSubmit, onCancel }: TradeProposalProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [outcomeType, setOutcomeType] = useState<WheelSlice['outcome_type']>('mild');
  const [probability, setProbability] = useState(0.10);
  const [step, setStep] = useState<'create' | 'confirm'>('create');

  const handleSubmit = () => {
    if (!label.trim() || !description.trim()) return;
    
    if (step === 'create') {
      setStep('confirm');
      return;
    }
    
    onSubmit({
      targetPlayerId: targetPlayer.id,
      slice: {
        label: label.trim(),
        description: description.trim(),
        probability,
        outcome_type: outcomeType,
      },
    });
  };

  const proposerNames = proposers.map(p => p.character_name || p.real_name).join(' & ');

  return (
    <Card variant="glass" className="max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-display text-xl font-bold">Create a Trade</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Propose something for <span className="text-[var(--accent-primary)]">{targetPlayer.character_name}</span>&apos;s wheel
              </p>
            </div>

            {/* What happens */}
            <Input
              label="What happens?"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Take a drink, Do 10 pushups..."
              maxLength={50}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Description (what they actually have to do)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full details of what happens if this lands..."
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 bg-[var(--color-abyss)] border border-white/10 rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Intensity
              </label>
              <div className="flex gap-2">
                {OUTCOME_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setOutcomeType(type.value)}
                    className={`
                      flex-1 py-3 rounded-lg font-medium transition-all
                      ${outcomeType === type.value
                        ? 'bg-[var(--accent-primary)] text-[var(--color-void)]'
                        : 'bg-[var(--color-abyss)] text-[var(--color-text-secondary)] hover:bg-white/5'
                      }
                    `}
                  >
                    <span className="mr-1">{type.emoji}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Probability */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Probability
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PROBABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProbability(opt.value)}
                    className={`
                      py-2 rounded-lg text-sm font-medium transition-all
                      ${probability === opt.value
                        ? 'bg-[var(--accent-primary)] text-[var(--color-void)]'
                        : 'bg-[var(--color-abyss)] text-[var(--color-text-secondary)] hover:bg-white/5'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                {PROBABILITY_OPTIONS.find(o => o.value === probability)?.odds}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!label.trim() || !description.trim()}
                className="flex-1"
              >
                Preview
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-display text-xl font-bold">Confirm Trade</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Review before sending to {targetPlayer.character_name}
              </p>
            </div>

            {/* Preview card */}
            <div className="bg-[var(--color-abyss)] rounded-lg p-4 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{label}</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    For {targetPlayer.character_name}&apos;s wheel
                  </p>
                </div>
                <span className="text-2xl">
                  {OUTCOME_TYPES.find(t => t.value === outcomeType)?.emoji}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Probability</span>
                <span className="font-mono font-bold">{formatProbability(probability)}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[var(--color-ember)]/10 border border-[var(--color-ember)]/30 rounded-lg p-3">
              <p className="text-sm text-[var(--color-ember)]">
                ⚠️ {targetPlayer.character_name} must accept this AND offer a trade in return for it to be added.
              </p>
            </div>

            {/* Proposers */}
            <p className="text-xs text-[var(--color-text-muted)] text-center">
              Proposed by: {proposerNames}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('create')} className="flex-1">
                Edit
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Send Proposal
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

