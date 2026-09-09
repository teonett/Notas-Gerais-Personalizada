const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatarData(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) {
    return ''
  }
  return formatadorData.format(data)
}

export function formatarDataHora(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) {
    return ''
  }
  return formatadorHora.format(data)
}

export function dataRelativa(iso: string, referencia = new Date()): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) {
    return ''
  }
  const diff = referencia.getTime() - data.getTime()
  const minutos = Math.floor(diff / 60_000)
  if (minutos < 1) {
    return 'agora'
  }
  if (minutos < 60) {
    return `${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    return `${horas} h`
  }
  const dias = Math.floor(horas / 24)
  if (dias < 7) {
    return `${dias} d`
  }
  if (dias < 30) {
    return `${Math.floor(dias / 7)} sem`
  }
  return formatarData(iso)
}