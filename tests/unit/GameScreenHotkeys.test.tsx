// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { createInitialState } from '@/engine/init';

// Mock heavy/scene-only modules so GameScreen can mount in jsdom without
// pulling three.js or the full board scene into the test.
vi.mock('@/scene/BoardScene', () => ({ BoardScene: () => null }));
vi.mock('@/app/SceneErrorBoundary', () => ({
  SceneErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/ui/Hud', () => ({ Hud: () => null }));
vi.mock('@/ui/CameraHint', () => ({ CameraHint: () => null }));
vi.mock('@/lib/audio', () => ({ audio: { play: () => {}, setMuted: () => {} } }));
vi.mock('@/lib/audioSideEffects', () => ({ useGameAudio: () => {} }));
vi.mock('@/lib/persist', () => ({ save: () => {}, clear: () => {} }));

import { GameScreen } from '@/app/GameScreen';

beforeEach(() => {
  useGameStore.setState({
    state: createInitialState(
      [
        { name: 'Alice', token: 'locomotive' },
        { name: 'Bob', token: 'top-hat' },
      ],
      99,
    ),
  });
  useUiStore.setState({
    phase: 'game',
    journalOpen: false,
    storyOpen: false,
    acquisitionsOpen: false,
  });
});

afterEach(() => {
  cleanup();
  useGameStore.getState().clear();
});

describe('GameScreen keyboard shortcuts', () => {
  it('opens the acquisitions modal when A is pressed', () => {
    render(<GameScreen />);
    expect(useUiStore.getState().acquisitionsOpen).toBe(false);

    fireEvent.keyDown(window, { key: 'a' });

    expect(useUiStore.getState().acquisitionsOpen).toBe(true);
  });

  it('does not open the acquisitions modal if another modal is already open', () => {
    useUiStore.setState({ journalOpen: true });
    render(<GameScreen />);

    fireEvent.keyDown(window, { key: 'a' });

    expect(useUiStore.getState().acquisitionsOpen).toBe(false);
  });

  it('closes the acquisitions modal when Escape is pressed', () => {
    useUiStore.setState({ acquisitionsOpen: true });
    render(<GameScreen />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useUiStore.getState().acquisitionsOpen).toBe(false);
  });
});
