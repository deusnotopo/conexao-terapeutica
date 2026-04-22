# Editais Engine MVP

MVP inicial do motor de editais orientado por software, sem depender de LLM.

## Objetivo

Transformar documentos e registros brutos de licitações em:

- dados estruturados
- score de aderência por nicho
- checklist inicial
- decisão preliminar: entrar / entrar com ressalvas / não entrar

## Estrutura

- `acquisition.py` — conectores, fingerprint de fonte e ciclo de coleta
- `document_ingestion.py` — ingestão de documentos, classificação e tabelas simples
- `operations.py` — fila em memória, retry e dead-letter
- `persistence.py` — SQLite para runs, notices e snapshots
- `models.py` — modelos de dados
- `profiles.py` — perfis de nicho/configuração
- `engine.py` — parsing, scoring e decisão
- `cli.py` — interface operacional para demo e status
- `sample_run.py` — execução de exemplo

## Como rodar

```bash
python business_lab/editais_engine/sample_run.py
python business_lab/editais_engine/cli.py demo
python business_lab/editais_engine/cli.py cron
python business_lab/editais_engine/cli.py status
python business_lab/editais_engine/cli.py report
python business_lab/editais_engine/cli.py runs
python business_lab/editais_engine/cli.py collect-live --url file:///D:/business_lab/editais_engine/live_fixture.json
python business_lab/editais_engine/cli.py export --format json --output D:/business_lab/editais_engine/out/rankings.json
python business_lab/editais_engine/cli.py events
python business_lab/editais_engine/cli.py versions
python business_lab/editais_engine/cli.py profiles
python business_lab/editais_engine/cli.py scheduler
python business_lab/editais_engine/tests.py
```

## Próximos passos

1. adicionar coletores reais por portal
2. adicionar OCR/PDF parser
3. persistir em SQLite/Postgres
4. expandir readiness engine com histórico documental por cliente
5. criar painel e fila operacional
6. conectar OCR real e coleta web real
7. criar automação diária/cron de coleta

## Capacidades atuais

- coleta mock com conector configurável por fonte
- fingerprint da fonte para auditoria e detecção de mudança de layout
- persistência SQLite para coletas, notices e snapshots
- readiness por empresa com certidões, capacidades e portfólio
- bid/no-bid profissional com política e contexto operacional
- camada operacional com fila, retry e dead-letter
- fila persistente SQLite para processamento operacional
- adaptadores de coleta HTML e JSON mockados
- ingestão de documentos com classificação inicial e merge de anexos
- parsing básico de texto bruto
- extração de valor, documentos, tags e região
- score de aderência por perfil
- decisão preliminar entrar / entrar com ressalvas / não entrar
- snapshot e diff entre versões
- detecção de retificação
- pacote executivo de decisão
- readiness engine inicial
- simulador bid / no-bid inicial
- ranking operacional para priorização de ataque comercial
- CLI operacional para inspeção rápida da fila e execução do demo
- persistência de ranking para relatório operacional
- histórico de runs do pipeline para automação/cron
- conector real HTTP/JSON via CLI para plugar fonte pública
- export operacional em CSV/JSON
- eventos e auditoria básica do pipeline
- deduplicação/versionamento persistido por hash de conteúdo
- perfis por vertical
- perfis externos via `profiles.json`
- comando oficial para Windows Task Scheduler

## Coleta real mínima

O comando abaixo permite plugar uma fonte JSON real sem mudar código, usando mapeamento de campos:

```bash
python business_lab/editais_engine/cli.py collect-live \
  --url https://fonte-publica.exemplo/api/notices \
  --source-name pncp \
  --items-key items \
  --field-id id \
  --field-title title \
  --field-body body
```

## Saída operacional

```bash
python D:/business_lab/editais_engine/cli.py export --format json --output D:/business_lab/editais_engine/out/rankings.json
python D:/business_lab/editais_engine/cli.py export --format csv --output D:/business_lab/editais_engine/out/rankings.csv
```