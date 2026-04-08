'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showRole?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function PlayerCard({
  player,
  isCurrentPlayer = false,
  showRole = true,
  size = 'md',
  onClick,
}: PlayerCardProps) {
  const sizes = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-xl',
  };

  // Generate avatar color from character name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#ff4444', '#ff6b35', '#ffd700', '#4ecdc4',
      '#9b5de5', '#ff69b4', '#00d4aa', '#00bcd4',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarColor = getAvatarColor(player.character_name || player.real_name);
  const initial = (player.character_name || player.real_name).charAt(0).toUpperCase();

  return (
    <motion.div
      className={`
        flex flex-col items-center gap-2 cursor-pointer
        ${isCurrentPlayer ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Avatar */}
      <div
        className={`
          ${sizes[size]}
          rounded-full flex items-center justify-center
          font-display font-bold text-white
          ring-2 ring-offset-2 ring-offset-[var(--color-void)]
          ${isCurrentPlayer ? 'ring-[var(--accent-primary)]' : 'ring-white/20'}
        `}
        style={{ backgroundColor: avatarColor }}
      >
        {initial}
      </div>

      {/* Name */}
      <div className="text-center">
        <p
          className={`
            font-medium leading-tight
            ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
          `}
        >
          {player.character_name || player.real_name}
        </p>
        {showRole && player.character_role && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {player.character_role}
          </p>
        )}
      </div>

      {/* Instigator points badge */}
      {player.instigator_points > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-gold)] text-[var(--color-void)] text-xs font-bold flex items-center justify-center"
        >
          {player.instigator_points}
        </motion.div>
      )}

      {/* Director badge */}
      {player.role === 'DIRECTOR' && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-violet)]/20 text-[var(--color-violet)]">
          Director
        </span>
      )}
    </motion.div>
  );
}

