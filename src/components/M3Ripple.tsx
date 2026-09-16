import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { M3_EASING } from '../utils/motion';

export interface RippleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface M3RippleProps {
  color?: string;
  className?: string;
}

/**
 * Material 3 Radial Ink Ripple Hook
 * Renders expanding radial ripples from the exact touch/click point.
 */
export function useM3Ripple({ color = 'bg-current', className = '' }: M3RippleProps = {}) {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  const addRipple = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Radius must cover the furthest corner from the tap coordinate
    const radius = Math.hypot(
      Math.max(x, rect.width - x),
      Math.max(y, rect.height - y)
    );
    const size = radius * 2;

    const newRipple: RippleEffect = {
      id: Date.now() + Math.random(),
      x: x - radius,
      y: y - radius,
      size,
    };

    setRipples((prev) => [...prev.slice(-3), newRipple]);
  }, []);

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const renderRipples = useCallback(() => (
    <span className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] ${className}`}>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.16 }}
            animate={{ scale: 1, opacity: 0.12 }}
            exit={{ opacity: 0 }}
            transition={{
              scale: { duration: 0.38, ease: M3_EASING.emphasizedDecelerate },
              opacity: { duration: 0.28, ease: M3_EASING.standard },
            }}
            onAnimationComplete={() => {
              // Auto-cleanup after expansion if still present
              setTimeout(() => removeRipple(ripple.id), 250);
            }}
            style={{
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
            }}
            className={`absolute rounded-full ${color}`}
          />
        ))}
      </AnimatePresence>
    </span>
  ), [ripples, className, color, removeRipple]);

  return {
    onPointerDown: addRipple,
    renderRipples,
  };
}

// Alias for backward compatibility
export const M3Ripple = useM3Ripple;

/**
 * Standalone wrapper component to easily add M3 Ink Ripple to any container
 */
export function M3RippleContainer({
  children,
  className = '',
  rippleColor = 'bg-m3-primary',
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rippleColor?: string }) {
  const { onPointerDown, renderRipples } = M3Ripple({ color: rippleColor });

  return (
    <div
      {...props}
      onPointerDown={(e) => {
        onPointerDown(e);
        props.onPointerDown?.(e);
      }}
      onClick={onClick}
      className={`relative overflow-hidden select-none cursor-pointer ${className}`}
    >
      {renderRipples()}
      {children}
    </div>
  );
}
