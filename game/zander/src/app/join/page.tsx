'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Validate room exists via Supabase
      router.push(`/profile/${code.toUpperCase()}`);
    } catch {
      setError('Room not found');
      setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      data-energy="MIDNIGHT"
    >
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-abyss)] to-[var(--color-surface)] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="text-[var(--color-text-muted)] hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold mb-2">Join Room</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Enter the 6-character room code shown on the TV
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD12"
            maxLength={6}
            className="text-center text-2xl tracking-[0.3em] font-mono uppercase"
            error={error}
            autoFocus
          />

          <Button
            type="submit"
            loading={loading}
            disabled={code.length !== 6}
            className="w-full"
            size="lg"
          >
            Join
          </Button>
        </form>

        {/* Hint */}
        <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
          The director will show the code on the shared screen
        </p>
      </motion.div>
    </main>
  );
}

