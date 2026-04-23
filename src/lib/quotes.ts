export const BREAK_QUOTES: string[] = [
  'Rest is part of the work.',
  'Small breaks fuel big focus.',
  'Clarity returns when you pause on purpose.',
  'Let your mind wander — it often finds the path.',
  'A calm break is a quiet investment in the next sprint.'
]

export function randomQuote(): string {
  const i = Math.floor(Math.random() * BREAK_QUOTES.length)
  return BREAK_QUOTES[i] ?? BREAK_QUOTES[0]!
}
