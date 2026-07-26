export const floor = (n: number, ndigits: number): number => {
  const shift = Math.pow(10, ndigits)
  return Math.floor(n * shift) / shift
}

const BULLET_LINE = /^[-*•]\s+/

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Within a single paragraph, render any `- item` / `* item` / `• item` lines
// as a real `<ul><li>` list (GitHub renders raw HTML inside table cells) and
// join any remaining prose lines with spaces, preserving the order they
// appeared in (e.g. an intro line followed by a bulleted list).
const renderParagraph = (paragraph: string): string => {
  const lines = paragraph
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const segments: string[] = []
  let prose: string[] = []
  let bullets: string[] = []

  const flushProse = (): void => {
    if (prose.length > 0) {
      segments.push(prose.join(' '))
      prose = []
    }
  }
  const flushBullets = (): void => {
    if (bullets.length > 0) {
      const items = bullets
        .map(line => `<li>${escapeHtml(line.replace(BULLET_LINE, ''))}</li>`)
        .join('')
      segments.push(`<ul>${items}</ul>`)
      bullets = []
    }
  }

  for (const line of lines) {
    if (BULLET_LINE.test(line)) {
      flushProse()
      bullets.push(line)
    } else {
      flushBullets()
      prose.push(escapeHtml(line))
    }
  }
  flushProse()
  flushBullets()

  return segments.join(' ')
}

// Markdown tables break if a cell contains a literal newline (each row must
// be a single line) or an unescaped pipe (it's the column delimiter). RSpec
// example descriptions and failure messages are free-form strings authored
// by developers and can contain either, so every value written into a table
// cell must be passed through this first.
//
// Blank-line paragraph breaks are preserved as `<br><br>` (GitHub renders raw
// HTML inside table cells) instead of being flattened away, so multi-line
// descriptions keep their paragraph/bullet structure instead of becoming one
// run-on sentence. Single hard-wrapped newlines within a paragraph are
// treated as ordinary word-wrap and collapsed to a single space, and bullet
// lines are rendered as an actual `<ul><li>` list instead of inline dashes.
export const sanitizeCell = (str: string): string => {
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\|/g, '\\|')
    .split(/\n[ \t]*\n+/)
    .map(renderParagraph)
    .filter(paragraph => paragraph.length > 0)
    .join('<br><br>')
}
