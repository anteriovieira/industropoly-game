// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AcquisitionsModal } from '@/ui/modals/AcquisitionsModal';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { createInitialState } from '@/engine/init';
import type { GameState, IndustryTile, PlayerId } from '@/engine/types';
import { TILES } from '@/content/tiles';

const TEXTILE_TILE_IDS = TILES.filter(
  (t): t is IndustryTile => t.role === 'industry' && t.sector === 'textiles',
).map((t) => t.id);

function seedGame(): GameState {
  return createInitialState(
    [
      { name: 'Alice', token: 'locomotive' },
      { name: 'Bob', token: 'top-hat' },
    ],
    42,
  );
}

function setOwner(
  state: GameState,
  tileId: number,
  owner: PlayerId | null,
  opts: { tier?: 0 | 1 | 2 | 3 | 4 | 5; mortgaged?: boolean } = {},
): GameState {
  return {
    ...state,
    tiles: {
      ...state.tiles,
      [tileId]: {
        owner,
        tier: opts.tier ?? 0,
        mortgaged: opts.mortgaged ?? false,
      },
    },
  };
}

beforeEach(() => {
  useGameStore.setState({ state: seedGame() });
  useUiStore.setState({ acquisitionsOpen: true });
});

afterEach(() => {
  cleanup();
  useGameStore.getState().clear();
  useUiStore.setState({ acquisitionsOpen: false });
});

describe('AcquisitionsModal', () => {
  it('renders the empty state when the active player owns nothing', () => {
    render(<AcquisitionsModal />);
    expect(screen.getByText(/Nenhuma aquisição ainda/i)).toBeInTheDocument();
    // Headers for Indústrias / Transportes / Utilidades should NOT render.
    expect(screen.queryByRole('heading', { name: 'Indústrias' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Transportes' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Utilidades públicas' })).toBeNull();
  });

  it('renders sector groups, monopoly badge, mortgaged badge, and tier labels', () => {
    let s = useGameStore.getState().state!;
    // Give p1 the full Textiles sector with mixed tiers; mortgage one tile.
    const tiers: Array<0 | 1 | 2 | 3 | 4 | 5> = [0, 2, 3, 4, 5];
    TEXTILE_TILE_IDS.forEach((id, i) => {
      s = setOwner(s, id, 'p1', {
        tier: tiers[i] ?? 0,
        mortgaged: i === 0,
      });
    });
    useGameStore.setState({ state: s });

    render(<AcquisitionsModal />);

    expect(screen.getByRole('heading', { name: 'Indústrias' })).toBeInTheDocument();
    expect(screen.getByTestId('acq-monopoly-textiles')).toHaveTextContent(/Monopólio/);
    expect(screen.getByText('Hipotecado')).toBeInTheDocument();
    // Tier labels for the 5 textile tiles in order: Base, Fábrica, Cooperativa, Estaleiro, Império.
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Fábrica')).toBeInTheDocument();
    expect(screen.getByText('Cooperativa')).toBeInTheDocument();
    expect(screen.getByText('Estaleiro')).toBeInTheDocument();
    expect(screen.getByText('Império')).toBeInTheDocument();
    // Summary tile count should be 5.
    const summary = screen.getByTestId('acq-summary');
    expect(within(summary).getByText('5')).toBeInTheDocument();
  });

  it('switches the rendered portfolio when a different player tab is selected, without dispatching', () => {
    let s = useGameStore.getState().state!;
    s = setOwner(s, TEXTILE_TILE_IDS[0]!, 'p1');
    s = setOwner(s, TEXTILE_TILE_IDS[1]!, 'p2');
    useGameStore.setState({ state: s });

    const dispatchSpy = vi.spyOn(useGameStore.getState(), 'dispatch');

    render(<AcquisitionsModal />);

    // Initial: p1 selected (active player), summary shows "1" tile.
    let summary = screen.getByTestId('acq-summary');
    expect(within(summary).getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('acq-tab-p2'));

    summary = screen.getByTestId('acq-summary');
    expect(within(summary).getByText('Bob')).toBeInTheDocument();
    expect(within(summary).getByText('1')).toBeInTheDocument();
    // Engine state must be unchanged.
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(useGameStore.getState().state).toBe(s);
  });
});
