import confetti from 'canvas-confetti';

// Above react-native-web's Modal layer so bursts show over celebration modals.
const CONFETTI_Z_INDEX = 10000;

/**
 * Fire a confetti burst from near the top-center of the viewport.
 * Respects the user's reduced-motion preference.
 */
export function celebrate(colors: string[], particleCount = 100): void {
  confetti({
    particleCount,
    spread: 100,
    startVelocity: 40,
    origin: { x: 0.5, y: 0.25 },
    colors,
    zIndex: CONFETTI_Z_INDEX,
    disableForReducedMotion: true,
  });
}
