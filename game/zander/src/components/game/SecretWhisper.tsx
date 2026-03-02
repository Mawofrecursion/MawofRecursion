'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================
// SECRET WHISPER
// The AI talks to you privately on your phone
// =========================

export interface Whisper {
  id: string;
  type: 'mission' | 'instigate' | 'hint' | 'encourage' | 'dare' | 'question';
  message: string;
  expires_in?: number | null; // Seconds until mission expires
  created_at: string;
}

interface SecretWhisperProps {
  whisper: Whisper | null;
  onDismiss: () => void;
  onMissionComplete?: (completed: boolean) => void;
}

const WHISPER_ICONS: Record<string, string> = {
  mission: '🎯',
  instigate: '😈',
  hint: '💡',
  encourage: '✨',
  dare: '🔥',
  question: '🤔',
};

const WHISPER_COLORS: Record<string, string> = {
  mission: 'from-yellow-600 to-orange-600',
  instigate: 'from-red-600 to-pink-600',
  hint: 'from-blue-600 to-cyan-600',
  encourage: 'from-green-600 to-emerald-600',
  dare: 'from-orange-600 to-red-600',
  question: 'from-purple-600 to-indigo-600',
};

export const SecretWhisper: React.FC<SecretWhisperProps> = ({
  whisper,
  onDismiss,
  onMissionComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Countdown timer for missions
  useEffect(() => {
    if (whisper?.expires_in) {
      setTimeLeft(whisper.expires_in);
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [whisper?.id, whisper?.expires_in]);

  if (!whisper) return null;

  const icon = WHISPER_ICONS[whisper.type] || '🤫';
  const colorGradient = WHISPER_COLORS[whisper.type] || 'from-purple-600 to-pink-600';
  const isMission = whisper.type === 'mission';

  return (
    <AnimatePresence>
      <motion.div
        key={whisper.id}
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <motion.div
          className={`relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${colorGradient}`}
          layoutId="whisper-card"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
          
          {/* Content */}
          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {icon}
                </motion.span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {whisper.type === 'mission' ? 'Secret Mission' : 'AI Whisper'}
                </span>
              </div>
              
              {/* Timer for missions */}
              {isMission && timeLeft !== null && (
                <div className={`text-sm font-mono font-bold ${timeLeft < 30 ? 'text-red-300 animate-pulse' : 'text-white/80'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Message */}
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-white text-lg leading-relaxed mb-4">
                    {whisper.message}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {isMission && onMissionComplete ? (
                      <>
                        <button
                          onClick={() => onMissionComplete(true)}
                          className="flex-1 py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✓ Done
                        </button>
                        <button
                          onClick={() => onMissionComplete(false)}
                          className="flex-1 py-2 px-4 bg-black/20 hover:bg-black/30 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✗ Skip
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={onDismiss}
                        className="flex-1 py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Got it
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Minimize handle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white/80"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </motion.div>

        {/* Privacy indicator */}
        <p className="text-center text-xs text-gray-500 mt-2">
          🔒 Only you can see this
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

// =========================
// WHISPER NOTIFICATION DOT
// Shows when there's an unread whisper
// =========================

interface WhisperNotificationProps {
  hasUnread: boolean;
  onClick: () => void;
}

export const WhisperNotification: React.FC<WhisperNotificationProps> = ({
  hasUnread,
  onClick,
}) => {
  if (!hasUnread) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg flex items-center justify-center"
    >
      <motion.span
        className="text-2xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        🤫
      </motion.span>
      
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-purple-400"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
    </motion.button>
  );
};

