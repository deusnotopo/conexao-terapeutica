# Prospecção de leads para vender sites, apps e automações

Este repositório agora tem um script inicial para a etapa que faltava do pedido original: começar a coletar contatos de empresas com potencial de precisar dos seus serviços.

## Arquivo

- `tools/prospeccao_leads.py`
- `tools/radar_demanda_social.py`

## O que ele faz

- monta buscas com segmentos que costumam comprar digitalização
- pesquisa no Google Maps via Playwright
- coleta empresa, telefone, site, e-mail e nota
- salva tudo em CSV

## Radar de demanda social

O arquivo `tools/radar_demanda_social.py` foi criado para vasculhar a web aberta e sinais públicos indexados de redes e comunidades, procurando pessoas e empresas demonstrando intenção de compra.

### Fontes públicas que ele tenta alcançar via busca aberta

- LinkedIn público indexado
- Reddit
- YouTube
- Instagram público indexado
- Facebook público indexado
- TikTok indexado
- X/Twitter indexado
- fóruns e páginas abertas

### O que ele coleta

- fonte
- palavra-chave
- título
- trecho/snippet
- URL
- padrão de intenção encontrado

### Como usar

```bash
python tools/radar_demanda_social.py --saida output/radar_social.csv --max-por-consulta 10
```

Ou com palavras-chave próprias:

```bash
python tools/radar_demanda_social.py --keywords "site para empresa" "criar aplicativo" "automação comercial"
```

## Como usar

```bash
python tools/prospeccao_leads.py --cidade "Sao Paulo SP" --max-por-busca 8 --saida output/leads_sp.csv
```

## Requisito

Instale Playwright no Python usado:

```bash
pip install playwright
python -m playwright install chromium
```

## Próximo passo recomendado

Depois de validar os leads, a próxima evolução ideal é:

1. adicionar score de prioridade
2. filtrar empresas sem site forte
3. identificar sinais de necessidade comercial
4. gerar uma mensagem pronta de abordagem

## Observação importante

Esse radar trabalha com **web aberta e resultados indexados**, o que é o caminho mais seguro para começar sem depender de login, API privada ou scraping agressivo de plataformas fechadas. Para LinkedIn, Instagram, TikTok e outras redes, o ideal no longo prazo é combinar:

1. APIs oficiais quando existirem
2. busca pública indexada
3. revisão humana
4. enriquecimento posterior do lead

## Painel comercial separado

O material de preços, estratégia de negociação, operação comercial e uso dos scripts foi separado da página de vendas e consolidado em:

- `PAINEL_DOUGLAS_RIEDLINGER.md`

Esse arquivo funciona como base operacional para:

- prospecção
- organização de contatos
- qualificação de leads
- abordagem comercial
- negociação
- uso recorrente dos scripts de coleta