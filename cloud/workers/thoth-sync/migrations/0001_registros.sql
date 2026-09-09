-- Tabela central de registros sincronizados (mirror LWW + tombstones).
CREATE TABLE IF NOT EXISTS registros (
  tipo TEXT NOT NULL,
  id TEXT NOT NULL,
  revisao_carimbo INTEGER NOT NULL,
  revisao_dispositivo TEXT NOT NULL,
  apagado INTEGER NOT NULL DEFAULT 0,
  dados TEXT,
  criado_em TEXT NOT NULL,
  PRIMARY KEY (tipo, id)
);

CREATE INDEX IF NOT EXISTS idx_registros_revisao
  ON registros (revisao_carimbo, revisao_dispositivo);