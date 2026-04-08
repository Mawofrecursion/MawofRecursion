'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  haptic?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent-primary)] text-[var(--color-void)] hover:brightness-110',
  ghost: 'bg-transparent border border-white/10 text-white hover:bg-white/5 hover:border-white/20',
  danger: 'bg-[var(--color-ember)] text-white hover:bg-[#ff5555]',
  success: 'bg-emerald-500 text-white hover:bg-emerald-400',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  haptic = true,
  className = '',
  children,
  disabled,
  type = 'button',
  onClick,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium font-display
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${haptic ? 'haptic' : ''}
        ${className}
      `}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      disabled={disabled || loading}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </motion.button>
  );
}
