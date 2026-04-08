'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================
// THE CINEMATIC STORY OVERLAY
// "Audio Erotica" / "The Dirty Book"
// =========================

export interface StoryData {
  id: string;
  text: string;
  imageUrl: string;
  audioUrl: string;
  audioDuration: number;
  characters: [string, string];
  trope: string;
  genre: string;
  intensity: number;
}

interface StoryOverlayProps {
  story: StoryData | null;
  onComplete: () => void;
  onSkip?: () => void;
}

export const StoryOverlay: React.FC<StoryOverlayProps> = ({
  story,
  onComplete,
  onSkip,
}) => {
  const [phase, setPhase] = useState<'fade_in' | 'playing' | 'fade_out' | 'idle'>('idle');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const words = story?.text.split(/\s+/) || [];

  // Reset state when story changes
  useEffect(() => {
    if (story) {
      setPhase('fade_in');
      setCurrentWordIndex(0);
      setImageLoaded(false);
      setAudioReady(false);
    } else {
      setPhase('idle');
    }
  }, [story?.id]);

  // Preload image
  useEffect(() => {
    if (story?.imageUrl && story.imageUrl !== '/fallback-scene.jpg') {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true); // Continue anyway
      img.src = story.imageUrl;
    } else if (story) {
      setImageLoaded(true);
    }
  }, [story?.imageUrl]);

  // Start playback when ready
  useEffect(() => {
    if (phase === 'fade_in' && imageLoaded) {
      const timer = setTimeout(() => {
        setPhase('playing');
        // Start audio if available
        if (audioRef.current && story?.audioUrl) {
          audioRef.current.play().catch(console.error);
        }
      }, 2000); // 2 second fade in
      return () => clearTimeout(timer);
    }
  }, [phase, imageLoaded, story?.audioUrl]);

  // Karaoke text animation - reveal words over time
  useEffect(() => {
    if (phase !== 'playing' || !story) return;

    const totalDuration = story.audioDuration || (words.length / 2.5); // ~150wpm
    const msPerWord = (totalDuration * 1000) / words.length;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => {
        if (prev >= words.length - 1) {
          clearInterval(interval);
          // Fade out after a pause
          setTimeout(() => {
            setPhase('fade_out');
            setTimeout(onComplete, 2000);
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, msPerWord);

    return () => clearInterval(interval);
  }, [phase, story, words.length, onComplete]);

  if (!story || phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        key={story.id}
        className="fixed inset-0 z-50 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'fade_out' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
      >
        {/* Background Image with Ken Burns Effect */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: story.audioDuration || 30, ease: 'linear' }}
        >
          {story.imageUrl && story.imageUrl !== '/fallback-scene.jpg' ? (
            <img
              src={story.imageUrl}
              alt="Scene"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.6) contrast(1.1)' }}
            />
          ) : (
            // Fallback gradient
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-950 to-black" />
          )}
        </motion.div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />

        {/* Vignette effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 md:p-16">
          {/* Characters indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute top-8 left-0 right-0 text-center"
          >
            <p className="text-sm text-purple-400/70 tracking-widest uppercase">
              {story.characters[0]} & {story.characters[1]}
            </p>
          </motion.div>

          {/* The Story Text - Karaoke Style */}
          <div className="max-w-3xl text-center">
            <p className="text-2xl md:text-4xl font-serif leading-relaxed tracking-wide">
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: index <= currentWordIndex ? 1 : 0.2,
                    color: index <= currentWordIndex ? '#ffffff' : '#666666',
                  }}
                  transition={{ duration: 0.3 }}
                  className="inline-block mr-[0.3em]"
                  style={{
                    textShadow: index <= currentWordIndex 
                      ? '0 0 30px rgba(168, 85, 247, 0.5)' 
                      : 'none',
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </div>

          {/* Audio Visualizer Bar (simplified) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'playing' ? 1 : 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-purple-500/50 rounded-full"
                animate={{
                  height: phase === 'playing' 
                    ? [8, 20 + Math.random() * 30, 8] 
                    : 8,
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5 + Math.random() * 0.5,
                  delay: i * 0.05,
                }}
              />
            ))}
          </motion.div>

          {/* Skip button (for Director) */}
          {onSkip && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              whileHover={{ opacity: 1 }}
              onClick={onSkip}
              className="absolute bottom-8 right-8 px-4 py-2 text-sm text-white/70 
                         border border-white/30 rounded-full hover:bg-white/10 transition-colors"
            >
              Skip →
            </motion.button>
          )}

          {/* Genre/Mood indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="absolute bottom-8 left-8 text-xs text-white/50 uppercase tracking-widest"
          >
            {story.genre} • {story.trope.replace('_', ' ')}
          </motion.div>
        </div>

        {/* Audio Element (hidden) */}
        {story.audioUrl && (
          <audio
            ref={audioRef}
            src={story.audioUrl}
            onCanPlay={() => setAudioReady(true)}
            onEnded={() => {
              // Audio finished, start fade out
              setTimeout(() => {
                setPhase('fade_out');
                setTimeout(onComplete, 2000);
              }, 1000);
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// =========================
// STORY TRIGGER COMPONENT
// For Director to select characters and trope
// =========================

interface StoryTriggerProps {
  players: Array<{ id: string; character_name: string; real_name: string }>;
  onTrigger: (characterA: string, characterB: string, trope: string, genre: string) => void;
  isGenerating: boolean;
}

export const StoryTrigger: React.FC<StoryTriggerProps> = ({
  players,
  onTrigger,
  isGenerating,
}) => {
  const [characterA, setCharacterA] = useState('');
  const [characterB, setCharacterB] = useState('');
  const [trope, setTrope] = useState('almost_kiss');
  const [genre, setGenre] = useState('noir');

  const TROPES = [
    { value: 'enemies_to_lovers', label: '⚔️ Enemies to Lovers' },
    { value: 'one_bed', label: '🛏️ One Bed' },
    { value: 'secret_meeting', label: '🌙 Secret Meeting' },
    { value: 'almost_kiss', label: '💋 Almost Kiss' },
    { value: 'trapped_together', label: '🚪 Trapped Together' },
    { value: 'forbidden', label: '🚫 Forbidden' },
    { value: 'confession', label: '💭 Confession' },
    { value: 'jealousy', label: '💚 Jealousy' },
    { value: 'reunion', label: '🔄 Reunion' },
    { value: 'power_play', label: '👑 Power Play' },
  ];

  const GENRES = [
    { value: 'noir', label: '🎬 Film Noir' },
    { value: 'regency', label: '👗 Regency Romance' },
    { value: 'modern', label: '🌃 Modern' },
    { value: 'gothic', label: '🏚️ Gothic' },
    { value: 'cyberpunk', label: '🌆 Cyberpunk' },
  ];

  const canTrigger = characterA && characterB && characterA !== characterB && !isGenerating;

  return (
    <div className="space-y-4 p-4 bg-black/40 rounded-xl border border-purple-500/30">
      <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
        📖 Story Director
        <span className="text-xs font-normal text-gray-500">(~$0.50/scene)</span>
      </h3>

      {/* Character Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Character A</label>
          <select
            value={characterA}
            onChange={(e) => setCharacterA(e.target.value)}
            className="w-full p-2 bg-black/60 border border-gray-700 rounded-lg text-white"
          >
            <option value="">Select...</option>
            {players.map((p) => (
              <option key={p.id} value={p.character_name}>
                {p.character_name} ({p.real_name})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Character B</label>
          <select
            value={characterB}
            onChange={(e) => setCharacterB(e.target.value)}
            className="w-full p-2 bg-black/60 border border-gray-700 rounded-lg text-white"
          >
            <option value="">Select...</option>
            {players.filter(p => p.character_name !== characterA).map((p) => (
              <option key={p.id} value={p.character_name}>
                {p.character_name} ({p.real_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trope Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Trope</label>
        <select
          value={trope}
          onChange={(e) => setTrope(e.target.value)}
          className="w-full p-2 bg-black/60 border border-gray-700 rounded-lg text-white"
        >
          {TROPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Genre Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Genre</label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full p-2 bg-black/60 border border-gray-700 rounded-lg text-white"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => onTrigger(characterA, characterB, trope, genre)}
        disabled={!canTrigger}
        className={`w-full py-3 rounded-lg font-bold text-lg transition-all
          ${canTrigger 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white' 
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              ⏳
            </motion.span>
            Generating...
          </span>
        ) : (
          '🎬 ACTION!'
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Writes a scene, generates imagery, and narrates it on the TV.
      </p>
    </div>
  );
};

