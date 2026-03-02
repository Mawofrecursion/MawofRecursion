'use client';

import { motion } from 'framer-motion';

interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  type?: string;
  name?: string;
  id?: string;
}

export function Input({ 
  label, 
  error, 
  hint, 
  className = '',
  value,
  onChange,
  placeholder,
  maxLength,
  autoFocus,
  type = 'text',
  name,
  id,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          {label}
        </label>
      )}
      <motion.input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`
          w-full px-4 py-3
          bg-[var(--color-abyss)]
          border border-white/10
          rounded-lg
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          transition-all duration-150
          focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20
          ${error ? 'border-[var(--color-ember)]' : ''}
          ${className}
        `}
        whileFocus={{ scale: 1.01 }}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-[var(--color-ember)]"
        >
          {error}
        </motion.p>
      )}
      {hint && !error && (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
