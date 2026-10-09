import { Fragment, type ReactNode } from 'react'
import { Quote } from 'lucide-react'

// Renders the lightweight Markdown subset used by articles (headings, lists,
// quotes, **bold**, *italic*) as React elements. Nothing is injected as HTML.

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    return <Fragment key={i}>{part}</Fragment>
  })
}

function withLineBreaks(text: string): ReactNode[] {
  return text.split('\n').flatMap((line, i) => (i === 0 ? renderInline(line) : [<br key={`br-${i}`} />, ...renderInline(line)]))
}

type Block =
  | { kind: 'h2' | 'h3' | 'p'; text: string }
  | { kind: 'quote'; text: string; cite?: string }
  | { kind: 'ul' | 'ol'; items: string[] }

function parse(content: string): Block[] {
  const blocks: Block[] = []
  const chunks = content.replace(/\r\n/g, '\n').split(/\n{2,}/)

  for (const raw of chunks) {
    const chunk = raw.trim()
    if (!chunk) continue
    const lines = chunk.split('\n')

    if (chunk.startsWith('### ')) { blocks.push({ kind: 'h3', text: chunk.slice(4) }); continue }
    if (chunk.startsWith('## ')) { blocks.push({ kind: 'h2', text: chunk.slice(3) }); continue }

    if (lines.every(l => l.startsWith('>'))) {
      const stripped = lines.map(l => l.replace(/^>\s?/, ''))
      const citeIdx = stripped.findIndex(l => /^[—–-]\s/.test(l))
      const cite = citeIdx >= 0 ? stripped[citeIdx].replace(/^[—–-]\s*/, '') : undefined
      const text = stripped.filter((_, i) => i !== citeIdx).join('\n')
      blocks.push({ kind: 'quote', text, cite })
      continue
    }

    if (lines.every(l => /^[-*•]\s+/.test(l))) {
      blocks.push({ kind: 'ul', items: lines.map(l => l.replace(/^[-*•]\s+/, '')) })
      continue
    }
    if (lines.every(l => /^\d+[.)]\s+/.test(l))) {
      blocks.push({ kind: 'ol', items: lines.map(l => l.replace(/^\d+[.)]\s+/, '')) })
      continue
    }

    // A paragraph followed directly by a list (no blank line between them).
    const listStart = lines.findIndex(l => /^([-*•]|\d+[.)])\s+/.test(l))
    if (listStart > 0 && lines.slice(listStart).every(l => /^([-*•]|\d+[.)])\s+/.test(l))) {
      blocks.push({ kind: 'p', text: lines.slice(0, listStart).join('\n') })
      const ordered = /^\d/.test(lines[listStart])
      blocks.push({ kind: ordered ? 'ol' : 'ul', items: lines.slice(listStart).map(l => l.replace(/^([-*•]|\d+[.)])\s+/, '')) })
      continue
    }

    blocks.push({ kind: 'p', text: chunk })
  }
  return blocks
}

export default function ArticleBody({ content }: { content: string }) {
  const blocks = parse(content)
  const firstParagraph = blocks.findIndex(b => b.kind === 'p')

  return (
    <>
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'h2':
            return <h2 key={idx} className="heading-lg text-3xl text-gray-900 dark:text-white mt-12 mb-4">{renderInline(block.text)}</h2>
          case 'h3':
            return (
              <h3 key={idx} className="heading-md text-2xl text-gray-900 dark:text-white mt-10 mb-4 pt-4 border-t border-sand-200 dark:border-dark-border">
                {renderInline(block.text)}
              </h3>
            )
          case 'quote':
            return (
              <blockquote key={idx} className="relative my-8 pl-6 pr-4 py-4 border-l-4 border-primary-500 bg-sand-100/70 dark:bg-dark-card/60 rounded-r-2xl font-serif text-lg text-gray-900 dark:text-gray-100">
                <Quote className="w-6 h-6 text-primary-500/40 absolute -top-2 left-2 pointer-events-none" aria-hidden="true" />
                <p className="italic">{withLineBreaks(block.text)}</p>
                {block.cite && <footer className="mt-2 text-sm not-italic text-gray-500 dark:text-gray-400 font-sans">— {block.cite}</footer>}
              </blockquote>
            )
          case 'ul':
          case 'ol': {
            const List = block.kind
            return (
              <List key={idx} className={`my-6 space-y-2 pl-6 ${block.kind === 'ol' ? 'list-decimal' : 'list-disc'}`}>
                {block.items.map((item, i) => <li key={i} className="leading-relaxed pl-1">{renderInline(item)}</li>)}
              </List>
            )
          }
          default:
            if (idx === firstParagraph && block.text.length > 1) {
              return (
                <p key={idx} className="my-5 leading-relaxed">
                  <span className="float-left text-5xl leading-[0.8] font-serif font-bold text-primary-600 dark:text-primary-400 mr-3 mt-1" aria-hidden="true">
                    {block.text.charAt(0)}
                  </span>
                  <span className="sr-only">{block.text.charAt(0)}</span>
                  {withLineBreaks(block.text.slice(1))}
                </p>
              )
            }
            return <p key={idx} className="my-5 leading-relaxed">{withLineBreaks(block.text)}</p>
        }
      })}
    </>
  )
}
