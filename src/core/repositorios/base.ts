import type { StoreName } from '../storage/config'

export function requisicaoParaPromessa<T>(requisicao: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requisicao.onsuccess = () => {
      resolve(requisicao.result)
    }
    requisicao.onerror = () => {
      reject(
        new Error((requisicao.error as Error)?.message ?? 'Falha no banco de dados'),
      )
    }
  })
}

export function comTransacao<T>(
  banco: IDBDatabase,
  storeNames: StoreName | StoreName[],
  modo: IDBTransactionMode,
  operar: (transacao: IDBTransaction) => Promise<T>,
): Promise<T> {
  const nomes = Array.isArray(storeNames) ? storeNames : [storeNames]
  const transacao = banco.transaction(nomes, modo)

  return new Promise<T>((resolve, reject) => {
    let resultado: T
    let pendente = true

    operar(transacao).then(
      (valor) => {
        resultado = valor
      },
      (erro: unknown) => {
        pendente = false
        reject(erro)
      },
    )

    transacao.oncomplete = () => {
      if (pendente) {
        pendente = false
        resolve(resultado)
      }
    }
    transacao.onerror = () => {
      if (pendente) {
        pendente = false
        reject(
          new Error((transacao.error as Error)?.message ?? 'Falha na transação'),
        )
      }
    }
    transacao.onabort = () => {
      if (pendente) {
        pendente = false
        reject(new Error('Transação abortada'))
      }
    }
  })
}