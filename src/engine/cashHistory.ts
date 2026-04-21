import type { GameState, PlayerId } from './types';

export interface CashHistoryEntry {
  index: number; // position in state.log
  delta: number; // positive = entry/receita, negative = saída/despesa
  amount: number; // absolute value
  reason: string; // short human label
  raw: string; // original log line
}

// Derives the player's cash movement history from the engine's append-only
// log. The log carries every cash mutation we care about in Portuguese free
// text; this parser matches the known shapes produced by the reducer.
// Receiver-side gains that aren't individually logged (e.g. rent paid to the
// owner) are intentionally missing — we only report what the log actually
// records.
export function cashHistoryForPlayer(
  state: GameState,
  playerId: PlayerId,
): CashHistoryEntry[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];
  const name = player.name;
  const out: CashHistoryEntry[] = [];

  for (let i = 0; i < state.log.length; i++) {
    const raw = state.log[i]!;
    if (!raw.startsWith(name + ' ')) continue;
    const rest = raw.slice(name.length + 1);

    const amountMatch = rest.match(/R\$(\d+)/);
    if (!amountMatch) continue;
    const amount = Number(amountMatch[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const kind = classify(rest);
    if (!kind) continue;

    out.push({
      index: i,
      delta: kind.sign * amount,
      amount,
      reason: kind.reason,
      raw,
    });
  }

  return out;
}

function classify(rest: string): { sign: 1 | -1; reason: string } | null {
  if (/^passou pelo Início e recebeu/.test(rest)) {
    return { sign: 1, reason: 'Passou pelo Início' };
  }
  if (/^hipotecou/.test(rest)) return { sign: 1, reason: 'Hipoteca' };
  if (/^recebeu/.test(rest)) return { sign: 1, reason: 'Recebido' };

  if (/pagou R\$\d+ de aluguel/.test(rest)) return { sign: -1, reason: 'Aluguel' };
  if (/pagou R\$\d+ de imposto/.test(rest)) return { sign: -1, reason: 'Imposto' };
  if (/pagou a taxa de R\$\d+ da prisão/.test(rest)) {
    return { sign: -1, reason: 'Taxa da prisão' };
  }
  if (/foi forçado\(a\) a pagar a taxa de R\$\d+/.test(rest)) {
    return { sign: -1, reason: 'Taxa da prisão (forçada)' };
  }
  if (/^pagou R\$\d+ \(\d+ indústrias/.test(rest)) {
    return { sign: -1, reason: 'Decreto: taxa por patrimônio' };
  }
  if (/^pagou R\$\d+/.test(rest)) return { sign: -1, reason: 'Pagamento' };

  if (/^comprou uma dica por/.test(rest)) return { sign: -1, reason: 'Dica' };
  if (/^comprou .* por R\$\d+/.test(rest)) return { sign: -1, reason: 'Compra de casa' };
  if (/^resgatou .* por R\$\d+/.test(rest)) return { sign: -1, reason: 'Resgate de hipoteca' };

  return null;
}
