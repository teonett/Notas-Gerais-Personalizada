import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

const fonte = readFileSync(resolve('src/components/ui/Modal.tsx'), 'utf8')

const efeitoDeFoco = fonte.match(
  /useEffect\(\(\) => \{[\s\S]*?botaoFecharRef\.current\?\.focus\(\)[\s\S]*?\n  \}, \[([^\]]*)\]\)/,
)
const dependenciasDoEfeitoDeFoco = efeitoDeFoco?.[1]
  .split(',')
  .map((dependencia) => dependencia.trim())
  .filter(Boolean)

passo('Modal mantem callback de fechamento em ref', fonte.includes('const aoFecharRef = useRef(aoFechar)'))
passo('Modal atualiza ref quando aoFechar muda', fonte.includes('aoFecharRef.current = aoFechar'))
passo('efeito que foca o botao depende somente de aberto', dependenciasDoEfeitoDeFoco?.join(',') === 'aberto')
passo('Escape usa a versao atual de aoFechar pela ref', fonte.includes('aoFecharRef.current()'))

console.log(`\nMODAL FOCO OK | ${passos} passos`)
