export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} kB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatarEstimativa(bytes: number | undefined): string {
  if (bytes === undefined) {
    return 'indisponível'
  }
  return formatarTamanho(bytes)
}