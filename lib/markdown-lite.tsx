import { Fragment } from 'react'

// Vista previa del cuerpo de un comunicado: el mismo Markdown básico que renderiza el mail
// (párrafos, listas con "- ", **negrita**, *cursiva* y [links](https://…)). Sin HTML crudo.

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g

function inline(text: string) {
  return text.split(INLINE).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^(\*[^*].*\*|_.+_)$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="text-primary underline">
          {link[1]}
        </a>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={i} className="list-disc pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
