import { useEffect, useState, type FormEvent } from 'react'
import { Lock, LogIn, Plus, ShieldCheck } from 'lucide-react'
import type { ContaLocal } from '../../domain'
import { getMensagemUsuario } from '../../core/errors'
import { listarContas } from '../../core/auth/contas'
import { criarContaLocal, desbloquear } from '../../core/auth/sessao'
import { haDadosNoBancoAtual, migrarDadosLegados } from '../../core/auth/legado'
import { Button, Card, Input } from '../../components/ui'
import { Logo } from '../../layout/Logo'

export function LoginPage() {
  const [contas, setContas] = useState<ContaLocal[]>([])
  const [carregandoContas, setCarregandoContas] = useState(true)
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [haDadosLegados, setHaDadosLegados] = useState(false)
  const [migrando, setMigrando] = useState(false)

  useEffect(() => {
    let ativo = true
    void listarContas().then((encontradas) => {
      if (!ativo) {
        return
      }
      setContas(encontradas)
      if (encontradas.length === 0) {
        setModo('criar')
      }
      setCarregandoContas(false)
    })
    return () => {
      ativo = false
    }
  }, [])

  async function prepararNovoUsuario() {
    const tem = await haDadosNoBancoAtual()
    setHaDadosLegados(tem)
    setModo('criar')
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      if (modo === 'criar') {
        if (senha !== confirmacao) {
          setErro('A confirmação da senha não coincide.')
          return
        }
        const tinhaLegado = await haDadosNoBancoAtual()
        await criarContaLocal(nome, senha)
        setHaDadosLegados(tinhaLegado)
      } else {
        await desbloquear(nome, senha)
      }
    } catch (falha: unknown) {
      setErro(getMensagemUsuario(falha))
    } finally {
      setEnviando(false)
    }
  }

  async function migrar() {
    setMigrando(true)
    setErro(null)
    try {
      await migrarDadosLegados()
      setHaDadosLegados(false)
    } catch (falha: unknown) {
      setErro(getMensagemUsuario(falha))
    } finally {
      setMigrando(false)
    }
  }

  if (carregandoContas) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Carregando…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Cofre do ThothNet</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suas notas são criptografadas com sua senha neste dispositivo.
            </p>
          </div>
        </div>

        <Card className="p-6">
          {modo === 'entrar' && contas.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Contas locais
              </p>
              <div className="flex flex-wrap gap-2">
                {contas.map((conta) => (
                  <button
                    key={conta.id}
                    type="button"
                    onClick={() => setNome(conta.nome)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      nome.trim().toLocaleLowerCase('pt-BR') === conta.nomeNorm
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-300 text-slate-600 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {conta.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => void enviar(e)} className="space-y-4">
            <Input
              rotulo="Usuário"
              autoComplete="username"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="seu nome de usuário"
            />
            <Input
              rotulo="Senha"
              type="password"
              autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
            {modo === 'criar' && (
              <Input
                rotulo="Confirmar senha"
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="••••••••"
              />
            )}

            {erro !== null && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {erro}
              </p>
            )}

            <Button
              type="submit"
              tamanho="lg"
              className="w-full"
              disabled={enviando || nome.trim() === '' || senha === ''}
            >
              {modo === 'criar' ? (
                <>
                  <Plus className="size-4" aria-hidden="true" />
                  Criar conta
                </>
              ) : (
                <>
                  <LogIn className="size-4" aria-hidden="true" />
                  Desbloquear
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {modo === 'criar' ? (
              <span>
                Se perder a senha, os dados dessa conta ficam permanentemente ilegíveis.
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void prepararNovoUsuario()}
                className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Criar outra conta
              </button>
            )}
          </div>
        </Card>

        {modo === 'criar' && haDadosLegados && (
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-5 text-amber-600" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold">Dados anteriores encontrados</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Existem notas no banco antigo. Você pode migrá-las para dentro da nova conta
                  criptografada.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button tamanho="sm" onClick={() => void migrar()} disabled={migrando}>
                    {migrando ? 'Migrando…' : 'Migrar dados'}
                  </Button>
                  <Button
                    tamanho="sm"
                    variante="fantasma"
                    onClick={() => setHaDadosLegados(false)}
                  >
                    Ignorar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}