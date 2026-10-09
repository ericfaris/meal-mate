import { describe, expect, it, vi } from 'vitest';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import confetti from 'canvas-confetti';
import { celebrate } from './confetti';

describe('celebrate', () => {
  it('fires above modals and respects reduced motion', () => {
    celebrate(['#B14E33'], 80);
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 80,
        colors: ['#B14E33'],
        zIndex: 10000,
        disableForReducedMotion: true,
      })
    );
  });
});
