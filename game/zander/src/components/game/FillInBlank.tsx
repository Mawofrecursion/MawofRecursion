'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { FillInTemplate } from '@/lib/prompts/fill-in-templates';

// =========================
// FILL-IN-THE-BLANK INPUT
// Phone view - where the magic (filth) happens
// =========================

interface FillInBlankProps {
  template: FillInTemplate;
  targetPlayer?: string; // If template mentions a specific player
  onSubmit: (answers: string[]) => void;
  timeLimit?: number; // Seconds
}

export const FillInBlank: React.FC<FillInBlankProps> = ({
  template,
  targetPlayer,
  onSubmit,
  timeLimit = 60,
}) => {
  const [answers, setAnswers] = useState<string[]>(
    new Array(template.placeholders.length).fill('')
  );
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [focusedField, setFocusedField] = useState<number | null>(null);

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft <= 0) {
      // Auto-submit with whatever they have
      handleSubmit();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    // Fill empty answers with "???"
    const filledAnswers = answers.map(a => a.trim() || '???');
    onSubmit(filledAnswers);
  };

  const canSubmit = answers.some(a => a.trim().length > 0);

  // Build preview of what will be shown
  const buildPreview = () => {
    let preview = template.template;
    
    if (targetPlayer) {
      preview = preview.replace('{PLAYER}', targetPlayer);
    } else if (template.requires_player) {
      preview = preview.replace('{PLAYER}', '???');
    }
    
    answers.forEach((answer, index) => {
      const display = answer.trim() || `[${template.placeholders[index]}]`;
      preview = preview.replace(`{${index}}`, display);
    });
    
    return preview;
  };

  return (
    <div className="space-y-6">
      {/* Timer */}
      <div className="flex justify-center">
        <motion.div
          className={`text-4xl font-mono font-bold ${
            timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-purple-400'
          }`}
          animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </motion.div>
      </div>

      {/* Instructions */}
      <Card variant="glass" className="p-4 text-center">
        <p className="text-sm text-gray-400 mb-2">Fill in the blanks:</p>
        <p className="text-lg font-display leading-relaxed">
          {template.placeholders.map((placeholder, i) => (
            <span key={i}>
              {i > 0 && ' + '}
              <span className="text-purple-400">{placeholder}</span>
            </span>
          ))}
        </p>
      </Card>

      {/* Input Fields */}
      <div className="space-y-4">
        {template.placeholders.map((placeholder, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <label className="block text-sm text-gray-400 mb-1">
              {placeholder}
            </label>
            <motion.input
              type="text"
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              onFocus={() => setFocusedField(index)}
              onBlur={() => setFocusedField(null)}
              placeholder={`Enter a ${placeholder.toLowerCase()}...`}
              maxLength={50}
              className={`w-full px-4 py-3 rounded-xl bg-black/60 border-2 transition-all
                text-xl text-center font-bold
                ${focusedField === index 
                  ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                  : 'border-gray-700'
                }`}
              animate={{
                scale: focusedField === index ? 1.02 : 1,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Live Preview */}
      <Card variant="secret" className="p-4">
        <p className="text-xs text-gray-500 mb-2">Preview:</p>
        <p className="text-sm leading-relaxed italic">
          "{buildPreview()}"
        </p>
      </Card>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        size="lg"
        className="w-full"
      >
        {canSubmit ? '🚀 Submit Answer' : 'Fill in at least one blank'}
      </Button>

      {/* Encouragement */}
      <p className="text-xs text-gray-600 text-center">
        💡 The dirtier the answer, the funnier it gets
      </p>
    </div>
  );
};

// =========================
// FILL-IN CARD (For voting display)
// =========================

interface FillInCardProps {
  filledTemplate: string;
  author?: string;
  showAuthor: boolean;
  onVote?: () => void;
  isVoted?: boolean;
  voteCount?: number;
}

export const FillInCard: React.FC<FillInCardProps> = ({
  filledTemplate,
  author,
  showAuthor,
  onVote,
  isVoted,
  voteCount,
}) => {
  return (
    <motion.div
      whileHover={onVote ? { scale: 1.02 } : {}}
      whileTap={onVote ? { scale: 0.98 } : {}}
      onClick={onVote}
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer
        ${isVoted 
          ? 'border-purple-500 bg-purple-500/20' 
          : 'border-gray-700 hover:border-purple-500/50 bg-black/40'
        }`}
    >
      <p className="text-lg leading-relaxed mb-2">
        "{filledTemplate}"
      </p>
      
      {showAuthor && author && (
        <p className="text-sm text-purple-400">— {author}</p>
      )}
      
      {voteCount !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          {voteCount} vote{voteCount !== 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  );
};

