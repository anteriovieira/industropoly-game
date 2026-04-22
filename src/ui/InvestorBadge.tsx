import { useId, type CSSProperties, type ReactNode } from 'react';

interface InvestorBadgeProps {
  color: string;
  label: ReactNode;
  size?: number;
  active?: boolean;
  title?: string;
  style?: CSSProperties;
  /** Render the label as engraved text inside the medallion. When false, the
   *  label is placed in the face as-is (useful for emoji token glyphs). */
  engrave?: boolean;
}

/**
 * A Victorian-style medallion used to represent each investor (player).
 * Rendered as SVG so the brass bezel, bevel and engraved face are crisp at
 * any size. Works as a drop-in replacement for simple colored circle badges.
 */
export function InvestorBadge({
  color,
  label,
  size = 40,
  active = false,
  title,
  style,
  engrave = true,
}: InvestorBadgeProps) {
  const uid = useId().replace(/:/g, '');
  const bezelId = `ib-bezel-${uid}`;
  const bezelShadeId = `ib-bezel-shade-${uid}`;
  const faceShadeId = `ib-face-${uid}`;
  const glareId = `ib-glare-${uid}`;
  const reedingId = `ib-reeding-${uid}`;

  return (
    <span
      aria-hidden="true"
      title={title}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        lineHeight: 0,
        flexShrink: 0,
        filter: active
          ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(250, 226, 160, 0.55))'
          : 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="presentation"
        focusable="false"
      >
        <defs>
          {/* Polished brass bezel — warm highlight at top-left, deep shadow
              at bottom-right to sell the rounded bevel. */}
          <linearGradient id={bezelId} x1="18%" y1="10%" x2="82%" y2="92%">
            <stop offset="0%" stopColor="#fff1c2" />
            <stop offset="22%" stopColor="#f0ce7a" />
            <stop offset="55%" stopColor="#a7772f" />
            <stop offset="85%" stopColor="#5a3a13" />
            <stop offset="100%" stopColor="#2a1806" />
          </linearGradient>

          {/* Inner lip of the bezel — a thin dark groove on the inside edge. */}
          <radialGradient id={bezelShadeId} cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="rgba(0,0,0,0)" />
            <stop offset="94%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </radialGradient>

          {/* Color-agnostic shading overlay for the face: top-left glow
              fading to a bottom-right vignette, preserving the accent color. */}
          <radialGradient id={faceShadeId} cx="32%" cy="26%" r="82%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="38%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="68%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>

          {/* Specular glare on the bezel. */}
          <radialGradient id={glareId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Reeded (milled) edge pattern — tiny radial ticks around the rim. */}
          <pattern
            id={reedingId}
            patternUnits="userSpaceOnUse"
            width="2.4"
            height="2.4"
            patternTransform="rotate(0)"
          >
            <rect width="1.2" height="2.4" fill="rgba(0,0,0,0.35)" />
            <rect x="1.2" width="1.2" height="2.4" fill="rgba(255,240,200,0.25)" />
          </pattern>
        </defs>

        {/* Outer bezel ring */}
        <circle cx="50" cy="50" r="49" fill={`url(#${bezelId})`} />

        {/* Milled edge — a thin reeded band just inside the outer rim */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`url(#${reedingId})`}
          strokeWidth="2.6"
          opacity="0.65"
        />

        {/* Bezel inner groove (dark lip that divides bezel and face) */}
        <circle cx="50" cy="50" r="43.5" fill={`url(#${bezelShadeId})`} />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#1a0e04"
          strokeWidth="0.9"
          opacity="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(255,240,200,0.35)"
          strokeWidth="0.5"
          transform="translate(0 0.7)"
        />

        {/* Colored medallion face */}
        <circle cx="50" cy="50" r="40.5" fill={color} />
        <circle cx="50" cy="50" r="40.5" fill={`url(#${faceShadeId})`} />

        {/* Engraved inner ring on the face */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.55"
        />
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.45"
          transform="translate(0 0.7)"
        />

        {/* Specular highlight ellipse on the top-left of the bezel */}
        <ellipse
          cx="36"
          cy="26"
          rx="24"
          ry="9"
          fill={`url(#${glareId})`}
          opacity="0.55"
          transform="rotate(-28 36 26)"
        />

        {/* Engraved label */}
        {engrave ? (
          <>
            {/* Deep shadow (bottom) */}
            <text
              x="50"
              y="54"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-display, 'Cinzel', serif)"
              fontSize="42"
              fontWeight={700}
              fill="rgba(0,0,0,0.55)"
            >
              {label}
            </text>
            {/* Highlight (top) */}
            <text
              x="50"
              y="51.2"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-display, 'Cinzel', serif)"
              fontSize="42"
              fontWeight={700}
              fill="rgba(255,245,214,0.55)"
            >
              {label}
            </text>
            {/* Face */}
            <text
              x="50"
              y="52"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-display, 'Cinzel', serif)"
              fontSize="42"
              fontWeight={700}
              fill="#fff5d6"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="0.4"
            >
              {label}
            </text>
          </>
        ) : (
          <foreignObject x="14" y="14" width="72" height="72">
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                lineHeight: 1,
                filter:
                  'drop-shadow(0 1.5px 0 rgba(0,0,0,0.55)) drop-shadow(0 -0.5px 0 rgba(255,245,214,0.4))',
              }}
            >
              {label}
            </div>
          </foreignObject>
        )}
      </svg>
    </span>
  );
}
