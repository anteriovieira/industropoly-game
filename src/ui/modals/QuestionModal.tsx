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
    return (
      <Modal
        title={correct ? 'Resposta correta!' : 'Resposta incorreta'}
        dismissible={false}
        footer={
          <button
            className="primary"
            onClick={() => {
              audio.play(correct ? 'click' : 'click');
              dispatch({ type: 'ANSWER_QUESTION', optionId: submitted });
            }}
          >
            Continuar
          </button>
        }
      >
        <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
          {correct
            ? 'Você pode prosseguir com a regra da casa.'
            : 'Seu turno será encerrado sem ação na casa.'}
        </p>
        <div
          style={{
            padding: '10px 12px',
            border: '1px solid rgba(59,43,24,0.35)',
            borderRadius: 6,
            background: 'rgba(243, 231, 193, 0.45)',
          }}
        >
          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 4 }}>
            Você sabia?
          </div>
          <strong>{tile.education.title}</strong> — <em>{tile.education.date}</em>
          <p style={{ margin: '6px 0' }}>{tile.education.blurb}</p>
          <small style={{ opacity: 0.75 }}>Fonte: {tile.education.source}</small>
        </div>
        <p style={{ marginTop: 12, fontSize: '0.85rem', opacity: 0.8 }}>
          Resposta correta: <strong>
            {question.options.find((o) => o.id === question.correctOptionId)?.text}
          </strong>
        </p>
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
      title={`Pergunta: ${tile.name}`}
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
      <div style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: 8 }}>
        Acerte para seguir com a regra da casa. Errar encerra o turno.
      </div>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>{question.prompt}</p>

      {clueTexts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: 'rgba(200, 168, 90, 0.25)',
            border: '1px dashed rgba(59,43,24,0.5)',
            borderRadius: 6,
            fontStyle: 'italic',
          }}
        >
          {clueTexts.map((c, i) => (
            <div key={i}>Dica: {c}</div>
          ))}
        </div>
      )}

      {firstLetterRevealed && firstLetter && (
        <div aria-live="polite" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
          Primeira letra da resposta: <strong>{firstLetter}</strong>
        </div>
      )}

      <div role="radiogroup" aria-label="Opções de resposta">
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

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            marginBottom: 6,
            fontSize: '0.95rem',
          }}
        >
          Loja de Dicas
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 8 }}>
          Cofre: £{p.cash}
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
        padding: '8px 10px',
        marginBottom: 6,
        border: selected
          ? '2px solid var(--accent, #a0410d)'
          : '1px solid rgba(59,43,24,0.4)',
        borderRadius: 6,
        opacity: eliminated ? 0.45 : 1,
        textDecoration: eliminated ? 'line-through' : 'none',
        cursor: 'pointer',
        background: selected ? 'rgba(160, 65, 13, 0.08)' : 'transparent',
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
      aria-label={`Comprar dica ${label} por £${hint.priceCash}`}
      style={{
        padding: '6px 10px',
        fontSize: '0.85rem',
        opacity: revealed ? 0.6 : 1,
        textDecoration: revealed ? 'line-through' : 'none',
      }}
      title={revealed ? 'Dica já revelada' : !canAfford ? 'Dinheiro insuficiente' : undefined}
    >
      {label} · £{hint.priceCash}
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
