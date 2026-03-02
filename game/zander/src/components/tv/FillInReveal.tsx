'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================
// FILL-IN REVEAL
// TV view - the dramatic reveal
// =========================

interface FillInRevealProps {
  template: string;        // Template with {0}, {1} etc
  answers: string[];       // The answers to slam in
  playerName?: string;     // Player who submitted (if showing)
  revealStyle: 'stamp' | 'typewriter' | 'slam' | 'whisper';
  onComplete?: () => void;
  showAuthor?: boolean;
}

export const FillInReveal: React.FC<FillInRevealProps> = ({
  template,
  answers,
  playerName,
  revealStyle,
  onComplete,
  showAuthor = true,
}) => {
  const [phase, setPhase] = useState<'template' | 'revealing' | 'complete'>('template');
  const [revealedCount, setRevealedCount] = useState(0);

  // Parse template into parts
  const parts = React.useMemo(() => {
    const result: Array<{ type: 'text' | 'blank'; content: string; index?: number }> = [];
    let lastIndex = 0;
    
    // Find all {0}, {1}, {2} etc
    const regex = /\{(\d+)\}/g;
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: template.slice(lastIndex, match.index),
        });
      }
      
      // Add the blank
      result.push({
        type: 'blank',
        content: answers[parseInt(match[1])] || '???',
        index: parseInt(match[1]),
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < template.length) {
      result.push({
        type: 'text',
        content: template.slice(lastIndex),
      });
    }
    
    return result;
  }, [template, answers]);

  const blankCount = parts.filter(p => p.type === 'blank').length;

  // Start reveal after showing template
  useEffect(() => {
    if (phase === 'template') {
      const timer = setTimeout(() => {
        setPhase('revealing');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Reveal blanks one by one
  useEffect(() => {
    if (phase === 'revealing' && revealedCount < blankCount) {
      const delay = revealStyle === 'typewriter' ? 1500 : 800;
      const timer = setTimeout(() => {
        setRevealedCount(c => c + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && revealedCount >= blankCount) {
      const timer = setTimeout(() => {
        setPhase('complete');
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, revealedCount, blankCount, revealStyle, onComplete]);

  // Get animation variants based on style
  const getBlankAnimation = (index: number) => {
    const isRevealed = index < revealedCount;
    
    switch (revealStyle) {
      case 'stamp':
        return {
          initial: { scale: 3, opacity: 0, rotate: -15 },
          animate: isRevealed 
            ? { scale: 1, opacity: 1, rotate: 0 }
            : { scale: 0, opacity: 0 },
          transition: { type: 'spring', damping: 10, stiffness: 200 },
        };
      
      case 'slam':
        return {
          initial: { y: -200, opacity: 0 },
          animate: isRevealed 
            ? { y: 0, opacity: 1 }
            : { y: -100, opacity: 0 },
          transition: { type: 'spring', damping: 15, stiffness: 300 },
        };
      
      case 'typewriter':
        return {
          initial: { opacity: 0, width: 0 },
          animate: isRevealed 
            ? { opacity: 1, width: 'auto' }
            : { opacity: 0, width: 0 },
          transition: { duration: 0.5 },
        };
      
      case 'whisper':
        return {
          initial: { opacity: 0, filter: 'blur(10px)' },
          animate: isRevealed 
            ? { opacity: 1, filter: 'blur(0px)' }
            : { opacity: 0, filter: 'blur(10px)' },
          transition: { duration: 1 },
        };
      
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: isRevealed ? 1 : 0 },
        };
    }
  };

  // Track which blank we're on
  let blankIndex = 0;

  return (
    <div className="text-center px-8 py-12">
      {/* The sentence */}
      <motion.div
        className="text-4xl md:text-5xl lg:text-6xl font-display leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <span key={i} className="text-white">
                {part.content}
              </span>
            );
          }
          
          // It's a blank
          const currentBlankIndex = blankIndex++;
          const isRevealed = currentBlankIndex < revealedCount;
          const animation = getBlankAnimation(currentBlankIndex);
          
          return (
            <span key={i} className="inline-block mx-2">
              <AnimatePresence mode="wait">
                {!isRevealed && phase !== 'complete' ? (
                  // Show blank placeholder
                  <motion.span
                    key="blank"
                    className="inline-block px-4 py-1 border-b-4 border-purple-500 text-purple-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    _____
                  </motion.span>
                ) : (
                  // Show the answer
                  <motion.span
                    key="answer"
                    className={`inline-block px-3 py-1 rounded-lg font-bold
                      ${revealStyle === 'stamp' ? 'bg-red-600 text-white transform -rotate-2' : ''}
                      ${revealStyle === 'slam' ? 'bg-yellow-500 text-black' : ''}
                      ${revealStyle === 'typewriter' ? 'bg-green-600 text-white font-mono' : ''}
                      ${revealStyle === 'whisper' ? 'bg-purple-600/50 text-purple-200 italic' : ''}
                    `}
                    {...animation}
                  >
                    {part.content}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          );
        })}
      </motion.div>

      {/* Author reveal */}
      <AnimatePresence>
        {phase === 'complete' && showAuthor && playerName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <p className="text-2xl text-purple-400">
              — {playerName}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound effect indicator (for future audio) */}
      {revealStyle === 'stamp' && revealedCount > 0 && (
        <motion.div
          initial={{ scale: 2, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          className="fixed inset-0 bg-red-500/20 pointer-events-none"
        />
      )}
      
      {revealStyle === 'slam' && revealedCount > 0 && (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, 5, -5, 0] }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 pointer-events-none"
        />
      )}
    </div>
  );
};

// =========================
// VOTING VIEW
// Show all answers for voting
// =========================

interface FillInVotingProps {
  template: string;
  submissions: Array<{
    id: string;
    answers: string[];
    playerId: string;
    playerName: string;
  }>;
  onVote: (submissionId: string) => void;
  currentVote?: string;
  showAuthors: boolean;
  voteCounts?: Record<string, number>;
}

export const FillInVoting: React.FC<FillInVotingProps> = ({
  template,
  submissions,
  onVote,
  currentVote,
  showAuthors,
  voteCounts,
}) => {
  // Build filled template for each submission
  const buildFilled = (answers: string[]) => {
    let result = template;
    answers.forEach((answer, index) => {
      result = result.replace(`{${index}}`, answer);
    });
    return result;
  };

  return (
    <div className="space-y-6 p-8">
      <h2 className="text-3xl font-display font-bold text-center mb-8">
        Vote for your favorite!
      </h2>
      
      <div className="grid gap-4 max-w-4xl mx-auto">
        {submissions.map((sub, index) => (
          <motion.button
            key={sub.id}
            onClick={() => onVote(sub.id)}
            className={`p-6 rounded-xl border-2 text-left transition-all
              ${currentVote === sub.id 
                ? 'border-purple-500 bg-purple-500/20 scale-105' 
                : 'border-gray-700 hover:border-purple-500/50 bg-black/40'
              }`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: currentVote === sub.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="text-2xl leading-relaxed">
              "{buildFilled(sub.answers)}"
            </p>
            
            <div className="mt-4 flex justify-between items-center">
              {showAuthors && (
                <span className="text-purple-400">— {sub.playerName}</span>
              )}
              
              {voteCounts && (
                <span className="text-sm text-gray-500">
                  {voteCounts[sub.id] || 0} votes
                </span>
              )}
              
              {currentVote === sub.id && (
                <span className="text-green-400 text-sm">✓ Your vote</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

