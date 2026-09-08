/**
 * MOCKEA Unified Motion Design System
 * Production-ready spring physics, easing presets, and reusable animation variants.
 */

// Universal Spring Configurations
export const springs = {
  // Ultra responsive, snappy UI feedback (buttons, toggles, small icons)
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  },
  // Smooth natural movement (cards, drawers, modals)
  gentle: {
    type: "spring",
    stiffness: 260,
    damping: 24,
  },
  // Tactile bounce (badges, celebration counters, success badges)
  bouncy: {
    type: "spring",
    stiffness: 350,
    damping: 16,
  },
  // Cinematic smooth transitions
  smooth: {
    type: "tween",
    ease: [0.25, 1, 0.5, 1], // easeOutQuart
    duration: 0.35,
  },
};

// Reusable Framer Motion Variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.25, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.18, ease: "easeIn" } 
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export const scalePop = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const staggerContainer = (staggerDelay = 0.06, initialDelay = 0.02) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: initialDelay,
    },
  },
});

export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.22, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.18, ease: "easeIn" } 
  },
};

export const modalPanelVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export const slideOverVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: springs.gentle,
  },
  exit: {
    x: "100%",
    transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] },
  },
};

// Micro-interaction presets
export const tactilePress = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { scale: 0.97, transition: { duration: 0.08 } },
};

export const cardHover = {
  whileHover: { 
    y: -4, 
    transition: springs.snappy 
  },
};
