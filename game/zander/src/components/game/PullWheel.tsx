'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import type { WheelSlice, SpinResult } from '@/lib/types';
import { spinWheel, formatProbability } from '@/lib/engine/fair-spin';

interface PullWheelProps {
  slices: WheelSlice[];
  onSpinComplete: (result: SpinResult) => void;
  disabled?: boolean;
  ownerName?: string;
}

const COLORS: Record<string, string> = {
  safe: '#4ecdc4',
  mild: '#ffd700',
  spicy: '#ff6b35',
  wild: '#ff4444',
};

export function PullWheel({ slices, onSpinComplete, disabled = false, ownerName }: PullWheelProps) {
  const [phase, setPhase] = useState<'ready' | 'pulling' | 'spinning' | 'result'>('ready');
  const [pullDistance, setPullDistance] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  
  const controls = useAnimation();
  const rotation = useMotionValue(0);
  const pullY = useMotionValue(0);
  
  // Pull handle spring effect
  const handleScale = useTransform(pullY, [0, 200], [1, 1.2]);
  const handleGlow = useTransform(pullY, [0, 200], [0, 1]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  
  // Handle pull start
  const handlePullStart = useCallback((clientY: number) => {
    if (disabled || phase !== 'ready') return;
    startY.current = clientY;
    setPhase('pulling');
  }, [disabled, phase]);
  
  // Handle pull move
  const handlePullMove = useCallback((clientY: number) => {
    if (phase !== 'pulling') return;
    const delta = clientY - startY.current;
    const clamped = Math.max(0, Math.min(200, delta)); // Max 200px pull
    setPullDistance(clamped / 200); // Normalize to 0-1
    pullY.set(clamped);
  }, [phase, pullY]);
  
  // Handle pull end (SPIN!)
  const handlePullEnd = useCallback(() => {
    if (phase !== 'pulling') return;
    
    // Must pull at least 20% to spin
    if (pullDistance < 0.2) {
      setPullDistance(0);
      pullY.set(0);
      setPhase('ready');
      return;
    }
    
    setPhase('spinning');
    
    // SPIN! The result is determined NOW, not by physics
    const spinResult = spinWheel(slices, pullDistance);
    setResult(spinResult);
    
    // Reset pull handle
    pullY.set(0);
    
    // Calculate visual rotation
    // Spin multiple times + land on the correct slice
    const sliceAngle = 360 / slices.length;
    const targetAngle = 360 - (spinResult.landed_on_index * sliceAngle) - (sliceAngle / 2);
    const spins = 5 + Math.floor(pullDistance * 5); // 5-10 full spins based on pull
    const totalRotation = (spins * 360) + targetAngle + 90; // +90 for pointer at top
    
    // Animate the wheel
    controls.start({
      rotate: totalRotation,
      transition: {
        duration: spinResult.spin_duration_ms / 1000,
        ease: [0.15, 0.65, 0.20, 1], // Custom easing for realistic slowdown
      },
    }).then(() => {
      setPhase('result');
      setPullDistance(0);
      
      // Notify parent after a moment
      setTimeout(() => {
        onSpinComplete(spinResult);
      }, 1500);
    });
  }, [phase, pullDistance, slices, controls, pullY, onSpinComplete]);
  
  // Touch/mouse handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handlePullStart(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    handlePullMove(e.touches[0].clientY);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    handlePullStart(e.clientY);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    handlePullMove(e.clientY);
  };
  
  // Global mouse up listener
  useEffect(() => {
    const handleUp = () => {
      if (phase === 'pulling') {
        handlePullEnd();
      }
    };
    
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [phase, handlePullEnd]);
  
  // Generate SVG paths for wheel slices
  const generateSlicePath = (index: number, total: number): string => {
    const anglePerSlice = 360 / total;
    const startAngle = (index * anglePerSlice - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * anglePerSlice - 90) * (Math.PI / 180);
    const radius = 140;
    const cx = 150;
    const cy = 150;
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const largeArc = anglePerSlice > 180 ? 1 : 0;
    
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };
  
  // Calculate label position
  const getLabelPosition = (index: number, total: number): { x: number; y: number; rotation: number } => {
    const anglePerSlice = 360 / total;
    const midAngle = (index * anglePerSlice + anglePerSlice / 2 - 90) * (Math.PI / 180);
    const radius = 90;
    const cx = 150;
    const cy = 150;
    
    return {
      x: cx + radius * Math.cos(midAngle),
      y: cy + radius * Math.sin(midAngle),
      rotation: (index * anglePerSlice + anglePerSlice / 2),
    };
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Owner name */}
      {ownerName && (
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {ownerName}&apos;s Wheel
        </p>
      )}
      
      {/* Wheel container */}
      <div className="relative w-[300px] h-[300px] mb-4">
        {/* Pointer */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '25px solid var(--color-ember)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        />
        
        {/* Wheel SVG */}
        <motion.svg
          viewBox="0 0 300 300"
          className="w-full h-full"
          animate={controls}
          style={{ rotate: rotation }}
        >
          {/* Slices */}
          {slices.map((slice, index) => {
            const labelPos = getLabelPosition(index, slices.length);
            return (
              <g key={slice.id}>
                <path
                  d={generateSlicePath(index, slices.length)}
                  fill={COLORS[slice.outcome_type]}
                  stroke="var(--color-void)"
                  strokeWidth="2"
                  className={`
                    transition-opacity
                    ${result && result.landed_on_index === index ? 'opacity-100' : 'opacity-85'}
                  `}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="var(--color-void)"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${labelPos.rotation}, ${labelPos.x}, ${labelPos.y})`}
                >
                  {slice.label.length > 10 ? slice.label.slice(0, 10) + '...' : slice.label}
                </text>
              </g>
            );
          })}
          
          {/* Center hub */}
          <circle
            cx="150"
            cy="150"
            r="25"
            fill="var(--color-void)"
            stroke="var(--color-text-muted)"
            strokeWidth="3"
          />
          <text
            x="150"
            y="150"
            fill="var(--color-text-primary)"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {phase === 'ready' ? 'PULL' : phase === 'pulling' ? 'LET GO' : '...'}
          </text>
        </motion.svg>
      </div>
      
      {/* Pull handle */}
      <motion.div
        className={`
          w-16 h-16 rounded-full 
          flex items-center justify-center
          cursor-grab active:cursor-grabbing
          transition-colors
          ${phase === 'ready' ? 'bg-[var(--accent-primary)]' : ''}
          ${phase === 'pulling' ? 'bg-[var(--color-ember)]' : ''}
          ${phase === 'spinning' || phase === 'result' ? 'bg-[var(--color-text-muted)] cursor-not-allowed' : ''}
        `}
        style={{
          scale: handleScale,
          boxShadow: `0 0 ${20 + pullDistance * 30}px rgba(255, 68, 68, ${0.3 + handleGlow.get() * 0.5})`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        whileTap={phase === 'ready' ? { scale: 0.95 } : undefined}
      >
        <span className="text-2xl">
          {phase === 'ready' && '↓'}
          {phase === 'pulling' && '⚡'}
          {phase === 'spinning' && '🎰'}
          {phase === 'result' && '✓'}
        </span>
      </motion.div>
      
      {/* Pull distance indicator */}
      {phase === 'pulling' && (
        <div className="mt-2 w-32 h-2 bg-[var(--color-abyss)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--color-ice)] to-[var(--color-ember)]"
            style={{ width: `${pullDistance * 100}%` }}
          />
        </div>
      )}
      
      {/* Instructions */}
      <p className="mt-4 text-sm text-[var(--color-text-muted)] text-center">
        {phase === 'ready' && 'Pull down and release to spin'}
        {phase === 'pulling' && `Pull more for longer spin (${Math.round(pullDistance * 100)}%)`}
        {phase === 'spinning' && 'Spinning...'}
        {phase === 'result' && result && (
          <span className="text-[var(--color-text-primary)] font-medium">
            {result.landed_on.label}
          </span>
        )}
      </p>
      
      {/* Fairness info */}
      {result && phase === 'result' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-xs text-[var(--color-text-muted)] text-center"
        >
          <p>Probability: {formatProbability(result.landed_on.probability)}</p>
          <p className="font-mono opacity-50">
            Seed: {result.random_seed.slice(0, 16)}...
          </p>
        </motion.div>
      )}
      
      {/* Result overlay */}
      {phase === 'result' && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-[var(--color-void)]/80 rounded-xl"
        >
          <div className="text-center p-6">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ backgroundColor: COLORS[result.landed_on.outcome_type] }}
            >
              {result.landed_on.outcome_type === 'safe' && '✓'}
              {result.landed_on.outcome_type === 'mild' && '🍺'}
              {result.landed_on.outcome_type === 'spicy' && '🌶️'}
              {result.landed_on.outcome_type === 'wild' && '🔥'}
            </div>
            <h3 className="text-xl font-display font-bold mb-2">
              {result.landed_on.label}
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              {result.landed_on.description}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

