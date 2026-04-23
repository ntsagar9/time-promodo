export function ProgressRing({ value }: { value: number }): JSX.Element {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full bg-accent transition-all" style={{ width: `${v * 100}%` }} />
    </div>
  )
}
