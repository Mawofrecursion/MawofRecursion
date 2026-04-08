'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface SecretCardProps {
  task: string;
  timeLimit: number; // seconds
  onComplete: (claimed: boolean) => void;
  targetCharacter?: string;
}

export function SecretCard({ task, timeLimit, onComplete, targetCharacter }: SecretCardProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [revealed, setRevealed] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!revealed || resolved) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [revealed, resolved]);

  const handleClaim = (claimed: boolean) => {
    setResolved(true);
    onComplete(claimed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="secret-card max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: revealed ? 0 : 180 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="front"
            className="text-center py-8"
            exit={{ opacity: 0 }}
          >
            <div className="text-4xl mb-4">🤫</div>
            <h3 className="text-xl font-display font-bold mb-2">
              You have a secret task
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Only you can see this. Tap to reveal.
            </p>
            <Button onClick={() => setRevealed(true)} variant="ghost">
              Reveal Task
            </Button>
          </motion.div>
        ) : !resolved ? (
          <motion.div
            key="back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Timer */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">TIME REMAINING</span>
              <span
                className={`font-mono text-lg font-bold ${
                  timeLeft < 30 ? 'text-[var(--color-ember)]' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[var(--color-abyss)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent-primary)]"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            {/* Task */}
            <div className="py-4">
              {targetCharacter && (
                <p className="text-sm text-[var(--color-text-muted)] mb-2">
                  Target: <span className="text-[var(--accent-primary)]">{targetCharacter}</span>
                </p>
              )}
              <p className="text-lg font-medium">{task}</p>
            </div>

            {/* Hint */}
            <p className="text-sm text-[var(--color-text-muted)] italic">
              The room will never know which option you chose.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleClaim(true)}
                variant="success"
                className="flex-1"
              >
                ✓ I did it
              </Button>
              <Button
                onClick={() => handleClaim(false)}
                variant="ghost"
                className="flex-1"
              >
                Take alternate
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-4xl mb-4">✓</div>
            <p className="text-[var(--color-text-secondary)]">
              Task resolved. Your secret is safe.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

