import { Transition, Variants } from 'motion/react';

/**
 * Material Design 3 (M3) Motion System Tokens & Presets
 * Grounded in official Android M3 Motion specifications.
 */

// 1. M3 Easing Curves (Cubic Bezier control points)
export const M3_EASING = {
  // Emphasized curve: Used for the most important transitions that demand user attention
  emphasized: [0.2, 0.0, 0.0, 1.0] as const,
  // Emphasized Decelerate: Entering elements (dialogs, bottom sheets, expanding cards)
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1.0] as const,
  // Emphasized Accelerate: Exiting elements (dismissed sheets, closed dialogs)
  emphasizedAccelerate: [0.3, 0.0, 0.8, 0.15] as const,
  // Standard curve: Non-emphasized UI state transitions (toggles, icons)
  standard: [0.2, 0.0, 0.0, 1.0] as const,
  // Standard Decelerate: Minor entering elements (chips, menus)
  standardDecelerate: [0.0, 0.0, 0.2, 1.0] as const,
  // Standard Accelerate: Minor exiting elements
  standardAccelerate: [0.3, 0.0, 1.0, 1.0] as const,
};

// 2. M3 Durations (in seconds for motion/react)
export const M3_DURATION = {
  short1: 0.05,
  short2: 0.1,
  short3: 0.15,
  short4: 0.2,
  medium1: 0.25,
  medium2: 0.3,
  medium3: 0.35,
  medium4: 0.4,
  long1: 0.45,
  long2: 0.5,
  long3: 0.55,
  long4: 0.6,
};

// 3. M3 Transition Presets
export const M3_TRANSITIONS = {
  // Surface / Container entering (Modals, Bottom Sheets, Card expansions)
  emphasizedEnter: {
    duration: M3_DURATION.long1,
    ease: M3_EASING.emphasizedDecelerate,
  } as Transition,

  // Surface / Container exiting
  emphasizedExit: {
    duration: M3_DURATION.medium1,
    ease: M3_EASING.emphasizedAccelerate,
  } as Transition,

  // Standard UI property transition (colors, elevations, size)
  standard: {
    duration: M3_DURATION.medium2,
    ease: M3_EASING.standard,
  } as Transition,

  // Spring physics for snappy gestures & chip state changes
  snappySpring: {
    type: 'spring',
    stiffness: 420,
    damping: 30,
  } as Transition,

  // Spring physics with a subtle tactile bounce
  bouncySpring: {
    type: 'spring',
    stiffness: 500,
    damping: 26,
  } as Transition,
};

// 4. M3 Shared Axis X Variants (for peer tab switching)
export const m3SharedAxisXVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 36 : -36,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { duration: M3_DURATION.medium3, ease: M3_EASING.emphasizedDecelerate },
      opacity: { duration: M3_DURATION.medium2, ease: M3_EASING.standard },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -36 : 36,
    opacity: 0,
    transition: {
      x: { duration: M3_DURATION.short4, ease: M3_EASING.emphasizedAccelerate },
      opacity: { duration: M3_DURATION.short3, ease: M3_EASING.standardAccelerate },
    },
  }),
};

// 5. M3 Shared Axis Y Variants (for expandable drawers, filters, details)
export const m3SharedAxisYVariants: Variants = {
  initial: {
    y: -14,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      y: { duration: M3_DURATION.medium2, ease: M3_EASING.emphasizedDecelerate },
      opacity: { duration: M3_DURATION.medium1, ease: M3_EASING.standard },
    },
  },
  exit: {
    y: -10,
    opacity: 0,
    transition: {
      y: { duration: M3_DURATION.short4, ease: M3_EASING.emphasizedAccelerate },
      opacity: { duration: M3_DURATION.short3, ease: M3_EASING.standardAccelerate },
    },
  },
};

// 6. M3 Bottom Sheet Physics configuration
export const M3_BOTTOM_SHEET_DRAG = {
  drag: 'y' as const,
  dragConstraints: { top: 0, bottom: 0 },
  dragElastic: { top: 0, bottom: 0.65 },
  dragSnapToOrigin: true,
  // Threshold to determine if sheet should be dismissed on release
  dismissThresholdY: 110,
  dismissVelocityY: 350,
};
