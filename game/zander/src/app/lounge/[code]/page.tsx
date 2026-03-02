'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlayerCard } from '@/components/game/PlayerCard';
import { MOCK_ROOM, MOCK_LOUNGE_PLAYERS } from '@/lib/mock-data';
import type { Room } from '@/lib/types';

export default function LoungePage() {
  const params = useParams();
  const code = params.code as string;

  const [room] = useState<Room>(MOCK_ROOM);
  const [players] = useState(MOCK_LOUNGE_PLAYERS);
  const [mainRoomStatus, setMainRoomStatus] = useState<string>('Something is happening...');
  const [showFOMO, setShowFOMO] = useState(false);

  useEffect(() => {
    const messages = [
      'The wheel is spinning in the main room...',
      'Laughter heard from the main room.',
      'Someone just got a SECRET TASK.',
      'The heat level just increased.',
      'A negotiation is happening...',
      'The Starlet and The Detective are in a Tunnel.',
      'Something WILD almost happened.',
    ];

    const interval = setInterval(() => {
      setMainRoomStatus(messages[Math.floor(Math.random() * messages.length)]);
      setShowFOMO(true);
      setTimeout(() => setShowFOMO(false), 3000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col p-6" data-energy="DUSK">
      <div className="fixed inset-0 bg-gradient-to-b from-violet-950/50 via-[var(--color-abyss)] to-[var(--color-surface)] -z-10" />

      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-violet-400">The Lounge</span>
            <h1 className="font-display text-2xl font-bold">Room {code}</h1>
          </div>
          <div className="text-right">
            <span className="text-sm text-[var(--color-text-muted)]">Main Room Heat</span>
            <p className="font-mono text-lg text-[var(--color-ember)]">{room.heat_level}/10</p>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showFOMO && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <Card variant="glass" className="text-center py-3 border-violet-500/30">
              <p className="text-sm text-violet-300">📡 {mainRoomStatus}</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mb-6">
        <h2 className="font-display font-semibold mb-4">In The Lounge ({players.length})</h2>
        <div className="flex gap-6">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} size="lg" />
          ))}
        </div>
      </Card>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
          <h2 className="font-display text-3xl font-bold mb-4">You stepped aside</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            The main room is doing something you opted out of. But here, in the quiet, something else might happen...
          </p>

          <Card variant="glass" className="mb-8 text-left">
            <p className="text-sm text-[var(--color-text-muted)] mb-2">The Lounge whispers:</p>
            <p className="font-display text-lg">&ldquo;So... why didn&apos;t you go?&rdquo;</p>
          </Card>

          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              You can talk freely here. The main room can&apos;t hear you.
            </p>
            <Button variant="ghost" className="w-full">💬 Open Chat</Button>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          📡 Main Room: <span className="text-violet-400">{mainRoomStatus}</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2 opacity-50">
          You&apos;ll rejoin when the round ends
        </p>
      </div>
    </main>
  );
}
