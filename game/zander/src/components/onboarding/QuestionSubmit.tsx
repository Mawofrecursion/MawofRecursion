'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Player, UserSubmittedQuestion } from '@/lib/types';
import { v4 as uuid } from 'uuid';

interface QuestionSubmitProps {
  currentPlayer: Player;
  roomId: string;
  onComplete: (questions: UserSubmittedQuestion[]) => void;
  minQuestions?: number;
  maxQuestions?: number;
}

const SPICINESS_LABELS = [
  { tier: 1, label: 'PG', emoji: '😊', description: 'Safe for anyone' },
  { tier: 3, label: 'Mild', emoji: '🌶️', description: 'A little cheeky' },
  { tier: 5, label: 'Spicy', emoji: '🌶️🌶️', description: 'Getting warm' },
  { tier: 7, label: 'Hot', emoji: '🔥', description: 'Things are heating up' },
  { tier: 10, label: 'Insane', emoji: '💀', description: 'Absolutely unhinged' },
];

const EXAMPLE_QUESTIONS = [
  "What's a secret you've never told anyone in this room?",
  "If you could switch lives with someone here for a day, who and why?",
  "What's the most embarrassing thing you've done drunk?",
  "Describe your ideal date using only movie titles",
  "What's something you've always wanted to try but been too scared?",
  "If you had to kiss someone in this room right now, who?",
  "What's your biggest turn-on that you've never admitted?",
  "Confess something to someone in this room right now",
];

export const QuestionSubmit: React.FC<QuestionSubmitProps> = ({
  currentPlayer,
  roomId,
  onComplete,
  minQuestions = 1,
  maxQuestions = 5,
}) => {
  const [questions, setQuestions] = useState<UserSubmittedQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentTier, setCurrentTier] = useState(5);
  const [showExamples, setShowExamples] = useState(false);

  const handleAddQuestion = () => {
    if (!currentQuestion.trim()) return;

    const newQuestion: UserSubmittedQuestion = {
      id: uuid(),
      room_id: roomId,
      submitted_by: currentPlayer.id, // Kept secret
      question_text: currentQuestion.trim(),
      tier: currentTier,
      min_act: currentTier <= 3 ? 1 : currentTier <= 6 ? 2 : 3,
      approved: true, // Auto-approved for now
      used: false,
      created_at: new Date().toISOString(),
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion('');
    setCurrentTier(5);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleComplete = () => {
    if (questions.length >= minQuestions) {
      onComplete(questions);
    }
  };

  const canAddMore = questions.length < maxQuestions;
  const canFinish = questions.length >= minQuestions;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <Card variant="glass" className="p-6 mb-6 text-center">
          <motion.span 
            className="text-4xl block mb-3"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            ✍️
          </motion.span>
          <h2 className="text-2xl font-bold mb-2">Submit Your Questions</h2>
          <p className="text-gray-400 text-sm">
            Add questions for everyone to answer. Go wild - 
            <span className="text-purple-400 font-bold"> no one will ever know who submitted what</span>.
          </p>
        </Card>

        {/* Anonymous guarantee */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6">
          <p className="text-xs text-purple-300 text-center">
            🔒 <strong>100% Anonymous</strong> - Your identity is never attached to these questions. 
            Even the game host can't see who submitted what.
          </p>
        </div>

        {/* Questions already added */}
        {questions.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-sm text-gray-400">Your questions ({questions.length}/{maxQuestions}):</p>
            <AnimatePresence>
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-2 p-3 bg-black/30 rounded-lg"
                >
                  <span className="text-lg">{SPICINESS_LABELS.find(l => l.tier === q.tier)?.emoji}</span>
                  <p className="flex-1 text-sm">{q.question_text}</p>
                  <button
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add new question */}
        {canAddMore && (
          <div className="space-y-4 mb-6">
            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Type your question... (can include {player} to target a random person)"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border-2 border-gray-700 
                         focus:border-purple-500 focus:outline-none transition-colors
                         text-white placeholder:text-gray-500 resize-none"
              rows={3}
              maxLength={300}
            />
            
            {/* Character count */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>{currentQuestion.length}/300</span>
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="text-purple-400 hover:text-purple-300"
              >
                {showExamples ? 'Hide examples' : 'Need inspiration?'}
              </button>
            </div>

            {/* Examples */}
            <AnimatePresence>
              {showExamples && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black/20 rounded-lg p-3 space-y-2"
                >
                  <p className="text-xs text-gray-400 mb-2">Click to use:</p>
                  {EXAMPLE_QUESTIONS.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestion(example)}
                      className="block text-left text-sm text-gray-300 hover:text-purple-400 
                                 transition-colors w-full p-2 hover:bg-black/30 rounded"
                    >
                      "{example}"
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spiciness selector */}
            <div>
              <p className="text-sm text-gray-400 mb-2">How spicy is this question?</p>
              <div className="flex gap-2">
                {SPICINESS_LABELS.map((level) => (
                  <motion.button
                    key={level.tier}
                    onClick={() => setCurrentTier(level.tier)}
                    className={`flex-1 p-2 rounded-lg border-2 transition-all text-center
                      ${currentTier === level.tier 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-gray-700 hover:border-gray-600'
                      }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl block">{level.emoji}</span>
                    <span className="text-xs">{level.label}</span>
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {SPICINESS_LABELS.find(l => l.tier === currentTier)?.description}
              </p>
            </div>

            {/* Add button */}
            <Button
              onClick={handleAddQuestion}
              disabled={!currentQuestion.trim()}
              className="w-full"
              variant="secondary"
            >
              Add Question ({questions.length}/{maxQuestions})
            </Button>
          </div>
        )}

        {/* Complete button */}
        <Button
          onClick={handleComplete}
          disabled={!canFinish}
          className="w-full"
          size="lg"
        >
          {canFinish 
            ? `Done (${questions.length} question${questions.length !== 1 ? 's' : ''} added)` 
            : `Add at least ${minQuestions} question${minQuestions !== 1 ? 's' : ''}`
          }
        </Button>

        {/* Skip option */}
        {minQuestions === 0 && questions.length === 0 && (
          <Button
            onClick={() => onComplete([])}
            variant="ghost"
            className="w-full mt-2"
          >
            Skip for now
          </Button>
        )}

        {/* Encouragement */}
        <p className="text-xs text-gray-600 text-center mt-6">
          💡 The best questions are ones that make people laugh, think, or squirm a little.
        </p>
      </motion.div>
    </div>
  );
};

