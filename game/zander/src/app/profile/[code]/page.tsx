'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface ProfileQuestion {
  id: string;
  question: string;
  type: 'slider' | 'choice';
  labels?: [string, string]; // For sliders
  options?: string[];        // For choice
  key: string;
}

const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: '1',
    question: 'In games, do you prefer...',
    type: 'slider',
    labels: ['Collaborating', 'Competing'],
    key: 'competitive_collaborative',
  },
  {
    id: '2',
    question: 'When playing, you tend to be...',
    type: 'slider',
    labels: ['Reserved', 'Expressive'],
    key: 'reserved_expressive',
  },
  {
    id: '3',
    question: 'Your role in group dynamics...',
    type: 'slider',
    labels: ['Observer', 'Instigator'],
    key: 'observer_instigator',
  },
  {
    id: '4',
    question: 'You prefer scenarios that are...',
    type: 'slider',
    labels: ['Realistic', 'Fantastical'],
    key: 'fantasy_realism',
  },
  {
    id: '5',
    question: 'Your comfort with attention...',
    type: 'slider',
    labels: ['Avoid spotlight', 'Love spotlight'],
    key: 'spotlight_comfort',
  },
  {
    id: '6',
    question: 'Your appetite for risk...',
    type: 'slider',
    labels: ['Play it safe', 'All in'],
    key: 'risk_appetite',
  },
  {
    id: '7',
    question: 'Your humor tolerance...',
    type: 'slider',
    labels: ['Keep it light', 'Dark is fine'],
    key: 'humor_tolerance',
  },
];

const CHARACTER_ROLES = [
  'The Detective',
  'The Stranger',
  'The Starlet',
  'The Rebel',
  'The Mystic',
  'The Diplomat',
  'The Trickster',
  'The Voyeur',
];

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const isDirector = searchParams.get('director') === 'true';

  const [step, setStep] = useState<'name' | 'profile' | 'character'>('name');
  const [realName, setRealName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [characterRole, setCharacterRole] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [profile, setProfile] = useState<Record<string, number>>({
    competitive_collaborative: 0.5,
    reserved_expressive: 0.5,
    observer_instigator: 0.5,
    fantasy_realism: 0.5,
    spotlight_comfort: 0.5,
    risk_appetite: 0.5,
    humor_tolerance: 0.5,
  });
  const [loading, setLoading] = useState(false);

  const handleNameSubmit = () => {
    if (realName.trim()) {
      setStep('profile');
    }
  };

  const handleSliderChange = (key: string, value: number) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < PROFILE_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setStep('character');
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    try {
      // TODO: Save to Supabase
      // For now, redirect to play
      router.push(`/play/${code}`);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      data-energy="DUSK"
    >
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-abyss)] to-[var(--color-surface)] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Room code */}
        <div className="text-center mb-8">
          <span className="text-sm text-[var(--color-text-muted)]">Room</span>
          <h2 className="font-mono text-2xl tracking-wider">{code}</h2>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Real Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-2xl font-bold mb-2">First, who are you?</h1>
                <p className="text-[var(--color-text-secondary)]">
                  Your real name stays private. Only used for couples matching.
                </p>
              </div>

              <Input
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />

              <Button
                onClick={handleNameSubmit}
                disabled={!realName.trim()}
                className="w-full"
                size="lg"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 2: Profile Questions */}
          {step === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex gap-1">
                {PROFILE_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= currentQuestion
                        ? 'bg-[var(--accent-primary)]'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="space-y-6">
                    <h3 className="font-display text-lg font-semibold">
                      {PROFILE_QUESTIONS[currentQuestion].question}
                    </h3>

                    {/* Slider */}
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={profile[PROFILE_QUESTIONS[currentQuestion].key]}
                        onChange={(e) =>
                          handleSliderChange(
                            PROFILE_QUESTIONS[currentQuestion].key,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-[var(--color-abyss)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                      />
                      <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                        <span>{PROFILE_QUESTIONS[currentQuestion].labels?.[0]}</span>
                        <span>{PROFILE_QUESTIONS[currentQuestion].labels?.[1]}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>

              <Button onClick={handleNextQuestion} className="w-full" size="lg">
                {currentQuestion < PROFILE_QUESTIONS.length - 1 ? 'Next' : 'Create Character'}
              </Button>
            </motion.div>
          )}

          {/* Step 3: Character Creation */}
          {step === 'character' && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-2xl font-bold mb-2">Create Your Character</h1>
                <p className="text-[var(--color-text-secondary)]">
                  You&apos;ll play as this character. Not yourself.
                </p>
              </div>

              <Input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                label="Character Name"
                placeholder="Detective Morrison, Luna, The Stranger..."
                autoFocus
              />

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  Choose a Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHARACTER_ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => setCharacterRole(role)}
                      className={`
                        px-4 py-3 rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${
                          characterRole === role
                            ? 'bg-[var(--accent-primary)] text-[var(--color-void)]'
                            : 'bg-[var(--color-abyss)] text-[var(--color-text-secondary)] hover:bg-white/5'
                        }
                      `}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleJoin}
                loading={loading}
                disabled={!characterName.trim() || !characterRole}
                className="w-full"
                size="lg"
              >
                {isDirector ? 'Start Game' : 'Join Game'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

