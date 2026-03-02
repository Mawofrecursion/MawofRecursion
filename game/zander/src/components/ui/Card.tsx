'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'secret';
  glow?: boolean;
  className?: string;
}

export function Card({ children, variant = 'default', glow = false, className = '' }: CardProps) {
  const variants = {
    default: 'bg-[var(--color-surface)] border-white/6',
    glass: 'bg-[var(--color-surface)]/80 backdrop-blur-xl border-white/8',
    secret: 'bg-gradient-to-br from-violet-500/20 to-red-500/10 border-violet-500/30',
  };

  return (
    <motion.div
      className={`
        rounded-xl border p-6
        transition-all duration-300
        ${variants[variant]}
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.12)' }}
    >
      {children}
    </motion.div>
  );
}
