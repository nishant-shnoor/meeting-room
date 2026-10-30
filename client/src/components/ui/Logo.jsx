import cn from '../../utils/cn'

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="#000000"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="Inter, Arial, Helvetica, sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="-1"
      >
        RB
      </text>
    </svg>
  )
}

export default function Logo({
  className,
  markClassName = 'size-9',
  textClassName = 'text-xl',
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 font-bold tracking-tight text-ink',
        className,
      )}
    >
      <LogoMark className={cn('shrink-0', markClassName)} />
      <span className={textClassName}>RoomBook</span>
    </span>
  )
}
