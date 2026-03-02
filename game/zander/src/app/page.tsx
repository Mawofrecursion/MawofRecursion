'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    // TODO: Create room via Supabase
    // For now, generate a mock code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/profile/${code}?director=true`);
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      data-energy="MIDNIGHT"
    >
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-abyss)] to-[var(--color-surface)] -z-10" />
      
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-ember)]/5 rounded-full blur-3xl -z-10" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-[var(--color-ember)] via-[var(--color-heat)] to-[var(--color-gold)] bg-clip-text text-transparent">
            ZANDER
          </span>
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-md mx-auto">
          A procedural narrative engine for groups who dare to play
        </p>
      </motion.div>

      {/* Main actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <Button
          onClick={handleCreate}
          loading={creating}
          size="lg"
          className="w-full"
        >
          Create Room
        </Button>
        
        <Button
          onClick={() => router.push('/join')}
          variant="ghost"
          size="lg"
          className="w-full"
        >
          Join Room
        </Button>
      </motion.div>

      {/* Features preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl"
      >
        <Card className="text-center">
          <div className="text-3xl mb-2">🎭</div>
          <h3 className="font-display font-semibold mb-1">Play Characters</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Masks create freedom
          </p>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl mb-2">🎰</div>
          <h3 className="font-display font-semibold mb-1">Honest Odds</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Near-miss &gt; hit
          </p>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl mb-2">🤫</div>
          <h3 className="font-display font-semibold mb-1">Secret Tasks</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            The alibi is the product
          </p>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-16 text-center text-sm text-[var(--color-text-muted)]"
      >
        <p>Built for courage, not coercion.</p>
        <p className="mt-1 opacity-50">🦷⟐</p>
      </motion.footer>
    </main>
  );
}
