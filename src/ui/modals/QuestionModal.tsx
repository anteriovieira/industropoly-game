import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useGameStore } from '@/state/gameStore';
import { activePlayer } from '@/engine/selectors';
import { getTile } from '@/content/tiles';
import { getQuestionById } from '@/content/questions';
import type { QuizHint, QuizOption } from '@/engine/types';
import { audio } from '@/lib/audio';

// The quiz modal. Shown while turnPhase === 'awaiting-quiz-answer'.
// Internally it has two phases: (1) answer, (2) result with "Did you know?"
// panel. Only on Continue from the result panel do we dispatch ANSWER_QUESTION
// — that guarantees the player reads the blurb with the answer in mind before
// the tile's consequence kicks in.
export function QuestionModal() {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const quiz = state.currentQuiz!;
  const tile = getTile(quiz.tileId);
  const question = getQuestionById(quiz.tileId, quiz.questionId);
  const p = activePlayer(state);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const firstLetter = useMemo(() => {
    if (!question) return '';
    return question.options.find((o) => o.id === question.correctOptionId)?.text.trim()[0] ?? '';
  }, [question]);

  if (!question) {
    // Defensive — content gap. Skip straight through.
    return (
      <Modal
        title={tile.name}
        dismissible={false}
        onConfirm={() => dispatch({ type: 'ANSWER_QUESTION', optionId: 'a' })}
        confirmLabel="Continuar"
      >
        <p>Esta casa ainda não tem uma pergunta cadastrada.</p>
      </Modal>
    );
  }

  // ---------- Result phase ----------
  if (submitted != null) {
    const correct = submitted === question.correctOptionId;
    const correctText = question.options.find((o) => o.id === question.correctOptionId)?.text;
    const accent = correct ? '#1f7a44' : '#a12a1f';
    const accentSoft = correct ? 'rgba(31, 122, 68, 0.1)' : 'rgba(161, 42, 31, 0.1)';
    return (
      <Modal
        title={correct ? 'Resposta correta' : 'Resposta incorreta'}
        label={correct ? 'Veredicto' : 'Veredicto'}
        dismissible={false}
        footer={
          <button
            className="primary"
            onClick={() => {
              audio.play('click');
              dispatch({ type: 'ANSWER_QUESTION', optionId: submitted });
            }}
          >
            Continuar
          </button>
        }
      >
        <div
          style={{
            padding: '14px 16px',
            border: `1px solid ${accent}`,
            borderLeft: `4px solid ${accent}`,
            borderRadius: 8,
            background: accentSoft,
            boxShadow: 'inset 0 1px 0 rgba(250, 226, 160, 0.2)',
            marginBottom: 14,
          }}
        >
          <div className="ind-label" style={{ color: accent, marginBottom: 4 }}>
            Resposta correta
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)' }}>
            {correctText}
          </div>
        </div>
        <p
          style={{
            margin: '0 0 14px',
            fontWeight: 600,
            color: accent,
            fontSize: '1rem',
          }}
        >
          {correct ? '✓ Sua peça avança.' : '✗ Você fica parado neste turno.'}
        </p>
        <div
          style={{
            padding: '12px 14px',
            border: '1px solid rgba(26, 14, 6, 0.3)',
            borderLeft: '3px solid #c9943a',
            borderRadius: 6,
            background:
              'linear-gradient(180deg, rgba(244, 230, 188, 0.55) 0%, rgba(232, 210, 160, 0.45) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(250, 226, 160, 0.3)',
          }}
        >
          <div className="ind-label" style={{ marginBottom: 4 }}>
            Lembrete · {tile.education.date}
          </div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem' }}>
            {tile.education.title}
          </strong>
          <p style={{ margin: '6px 0' }}>{tile.education.blurb}</p>
          <small style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            Fonte: {tile.education.source}
          </small>
        </div>
      </Modal>
    );
  }

  // ---------- Answer phase ----------
  const revealedHints = question.hints.filter((h) => quiz.revealedHints.includes(h.id));
  const clueTexts = revealedHints
    .filter((h) => h.kind === 'clue-text')
    .map((h) => h.payload);
  const firstLetterRevealed = revealedHints.some((h) => h.kind === 'first-letter');

  return (
    <Modal
      title={tile.name}
      label="O Cronista pergunta"
      dismissible={false}
      footer={
        <button
          className="primary"
          disabled={selected == null}
          onClick={() => {
            if (selected == null) return;
            audio.play('click');
            setSubmitted(selected);
          }}
        >
          Responder
        </button>
      }
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.08rem',
          lineHeight: 1.35,
          marginBottom: 14,
          color: 'var(--ink)',
        }}
      >
        {question.prompt}
      </p>

      {clueTexts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            background: 'rgba(232, 194, 106, 0.18)',
            border: '1px dashed rgba(138, 100, 34, 0.6)',
            borderLeft: '3px solid #c9943a',
            borderRadius: 6,
            fontStyle: 'italic',
            color: 'var(--ink-soft)',
          }}
        >
          {clueTexts.map((c, i) => (
            <div key={i}>Dica: {c}</div>
          ))}
        </div>
      )}

      {firstLetterRevealed && firstLetter && (
        <div
          aria-live="polite"
          style={{
            marginBottom: 12,
            fontSize: '0.9rem',
            color: 'var(--ink-soft)',
          }}
        >
          Primeira letra da resposta:{' '}
          <strong
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              color: 'var(--copper)',
            }}
          >
            {firstLetter}
          </strong>
        </div>
      )}

      <div role="radiogroup" aria-label="Opções de resposta" style={{ display: 'grid', gap: 6 }}>
        {question.options.map((opt) => (
          <OptionRow
            key={opt.id}
            opt={opt}
            selected={selected === opt.id}
            eliminated={quiz.eliminatedOptionIds.includes(opt.id)}
            onSelect={() => setSelected(opt.id)}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(26, 14, 6, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <span className="ind-label">Loja de Dicas</span>
          <span
            className="ind-tabular"
            style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}
          >
            Cofre: R${p.cash}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {question.hints.map((hint) => (
            <HintButton
              key={hint.id}
              hint={hint}
              revealed={quiz.revealedHints.includes(hint.id)}
              canAfford={p.cash >= hint.priceCash}
              onBuy={() => {
                audio.play('click');
                dispatch({ type: 'BUY_HINT', hintId: hint.id });
              }}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function OptionRow({
  opt,
  selected,
  eliminated,
  onSelect,
}: {
  opt: QuizOption;
  selected: boolean;
  eliminated: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        border: selected
          ? '1px solid #c9943a'
          : '1px solid rgba(26, 14, 6, 0.3)',
        borderLeft: selected ? '3px solid #c9943a' : '1px solid rgba(26, 14, 6, 0.3)',
        borderRadius: 6,
        opacity: eliminated ? 0.45 : 1,
        textDecoration: eliminated ? 'line-through' : 'none',
        cursor: 'pointer',
        background: selected
          ? 'linear-gradient(180deg, rgba(232, 194, 106, 0.22) 0%, rgba(201, 148, 58, 0.15) 100%)'
          : 'rgba(244, 230, 188, 0.25)',
        boxShadow: selected
          ? 'inset 0 1px 0 rgba(250, 226, 160, 0.4), 0 1px 3px rgba(10, 6, 2, 0.18)'
          : 'inset 0 1px 0 rgba(250, 226, 160, 0.2)',
        transition: 'all var(--motion-fast)',
      }}
    >
      <input
        type="radio"
        name="quiz-option"
        aria-checked={selected}
        checked={selected}
        onChange={onSelect}
        style={{ marginTop: 3 }}
      />
      <span>{opt.text}</span>
    </label>
  );
}

function HintButton({
  hint,
  revealed,
  canAfford,
  onBuy,
}: {
  hint: QuizHint;
  revealed: boolean;
  canAfford: boolean;
  onBuy: () => void;
}) {
  const label = hintLabel(hint);
  return (
    <button
      disabled={revealed || !canAfford}
      onClick={onBuy}
      aria-label={`Comprar dica ${label} por R$${hint.priceCash}`}
      style={{
        padding: '6px 10px',
        fontSize: '0.85rem',
        opacity: revealed ? 0.6 : 1,
        textDecoration: revealed ? 'line-through' : 'none',
      }}
      title={revealed ? 'Dica já revelada' : !canAfford ? 'Dinheiro insuficiente' : undefined}
    >
      {label} · R${hint.priceCash}
    </button>
  );
}

function hintLabel(hint: QuizHint): string {
  switch (hint.kind) {
    case 'eliminate-option':
      return 'Eliminar uma opção';
    case 'clue-text':
      return 'Pista em texto';
    case 'first-letter':
      return 'Primeira letra';
  }
}
