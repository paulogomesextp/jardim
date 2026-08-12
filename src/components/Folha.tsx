interface Props {
  bg?: string
  folha?: string
  ponto?: string
  tamanho?: number
  className?: string
}

/** Ícone de marca "Between Leaves": blob arredondado + folha, no estilo das artes da namorada do Paulo. */
export function Folha({ bg = 'var(--lima)', folha = 'var(--verde-900)', ponto = 'var(--lavanda)', tamanho = 28, className }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M50 6C74 6 92 28 92 54C92 80 72 94 50 94C28 94 8 80 8 54C8 28 26 6 50 6Z" fill={bg} />
      <path d="M50 24C68 30 76 46 68 63C61 78 50 82 50 82C50 82 39 78 32 63C24 46 32 30 50 24Z" fill={folha} />
      <path d="M50 30L50 78" stroke={bg} strokeWidth="3" strokeLinecap="round" />
      <circle cx="26" cy="68" r="6" fill={ponto} />
    </svg>
  )
}
