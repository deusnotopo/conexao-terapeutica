# Painel Douglas Riedlinger

## Objetivo

Este painel separa a operação comercial da página de vendas.

Ele serve para:

- organizar prospecção
- rodar scripts de coleta
- registrar contatos
- priorizar leads
- conduzir negociação
- fechar proposta com preço e próximo passo

---

## Estrutura operacional

## 1. Entrada de leads

Fontes principais:

- `tools/prospeccao_leads.py`
- `tools/radar_demanda_social.py`
- indicação
- busca manual
- Instagram, LinkedIn, Google Maps e sites públicos revisados manualmente

Arquivos de saída esperados:

- `output/leads_sp.csv`
- `output/radar_social.csv`
- futuras listas por nicho, cidade ou campanha

---

## 2. Organização mínima dos contatos

Cada lead deve ter, sempre que possível:

- empresa
- nome do contato
- cidade
- nicho
- telefone
- e-mail
- site
- Instagram/LinkedIn
- origem do lead
- dor percebida
- status comercial
- prioridade
- observações

### Status comercial sugerido

- novo
- pesquisado
- abordagem pronta
- contato enviado
- respondeu
- reunião marcada
- proposta enviada
- negociação
- fechado
- perdido

### Prioridade sugerida

- A = dor clara + ticket bom + decisão rápida
- B = potencial real, mas precisa aquecer
- C = contato fraco ou sem timing

---

## 3. Critérios de qualificação

Um lead sobe de prioridade quando tiver 3 ou mais sinais abaixo:

- operação manual visível
- site fraco ou inexistente
- atendimento confuso
- comunicação visual fraca
- empresa vende serviço de ticket médio ou alto
- empresa depende de captação
- há demanda por organização comercial
- há repetição de tarefas que podem virar automação
- existe equipe pequena fazendo trabalho operacional demais

---

## 4. Escada de oferta

### Oferta de entrada

**Landing page / página de vendas**

- faixa base: **R$ 3.500 a R$ 6.500**
- uso: abrir relacionamento rápido
- ideal quando o cliente precisa parecer mais profissional e captar melhor

### Oferta principal

**Painel / sistema / automação comercial**

- faixa base: **R$ 8.000 a R$ 18.000**
- uso: organizar operação, comercial e atendimento

### Oferta de máquina de leads

**Coleta + organização + filtros + enriquecimento inicial**

- setup: **R$ 3.000 a R$ 6.000**
- projeto fechado: **R$ 5.000 a R$ 12.000**
- mensal: **R$ 800 a R$ 2.500**

### Oferta premium

**Sistema com IA aplicada + automação + dashboard**

- faixa base: **R$ 18.000 a R$ 35.000**
- uso: quando há muito documento, decisão, operação ou prospecção para acelerar

---

## 5. Estratégia de negociação

## Regra principal

Não vender código.

Vender:

- organização
- velocidade
- percepção profissional
- automação
- geração de oportunidades
- redução de retrabalho
- clareza operacional

### Linguagem correta

> Eu construo páginas, sistemas, automações e soluções com IA aplicadas a negócios reais. Meu foco é tirar a operação do improviso e colocar algo funcional, profissional e vendável no ar.

### Linguagem para diagnóstico

Use perguntas como:

- hoje vocês perdem lead em qual parte do processo?
- o atendimento e comercial ficam em WhatsApp, planilha ou sistema?
- o cliente sente confiança no digital da empresa?
- o que hoje está muito manual e repetitivo?
- se eu organizasse isso em um sistema simples, qual ganho seria mais valioso para vocês?

---

## 6. Roteiro de abordagem

### Abordagem curta

> Fala, tudo bem? Analisei a presença digital/operação de vocês e vi espaço real para melhorar captação, organização e percepção profissional. Eu desenvolvo páginas, sistemas e automações voltadas para negócio real. Se fizer sentido, posso te mostrar em poucos minutos o que eu implementaria no caso de vocês.

### Abordagem focada em dor

> Vi que vocês já têm oferta e operação, mas ainda existe espaço para transformar parte do processo em algo mais profissional, automatizado e fácil de escalar. Trabalho justamente estruturando páginas, painéis e fluxos que reduzem retrabalho e ajudam a vender melhor.

### Abordagem para lead quente vindo do radar

> Vi um sinal claro de que vocês estão buscando melhorar presença digital/comercial/operação. Eu monto soluções práticas para isso: página de vendas, painel interno, automação e IA aplicada onde fizer sentido. Posso te mandar uma sugestão objetiva de caminho para o seu caso.

---

## 7. Próxima ação por tipo de lead

### Se o lead não tem site forte

Oferta inicial:

- landing page
- site institucional com CTA
- melhoria de apresentação

### Se o lead tem operação bagunçada

Oferta inicial:

- painel interno
- cadastros
- automação de rotina
- dashboards simples

### Se o lead precisa captar cliente

Oferta inicial:

- página de vendas
- automação comercial
- máquina de leads
- CRM leve / fluxo comercial

### Se o lead lida com muito dado, documento ou decisão

Oferta inicial:

- sistema com IA aplicada
- classificação
- busca
- sumarização
- apoio operacional

---

## 8. Operação semanal do painel

### Todo dia

1. rodar coleta
2. revisar CSV
3. limpar duplicados
4. classificar prioridade
5. preparar abordagem
6. enviar contatos
7. registrar resposta

### Toda semana

1. revisar nichos com melhor resposta
2. ajustar preço por tipo de cliente
3. identificar objeções recorrentes
4. melhorar copy de abordagem
5. selecionar cases para usar em negociação

---

## 9. Scripts disponíveis hoje

### `tools/prospeccao_leads.py`

Uso:

```bash
python tools/prospeccao_leads.py --cidade "Sao Paulo SP" --max-por-busca 8 --saida output/leads_sp.csv
```

Função:

- pesquisar segmentos no Google Maps
- coletar empresa, telefone, site, e-mail, nota e consulta

### `tools/radar_demanda_social.py`

Uso:

```bash
python tools/radar_demanda_social.py --saida output/radar_social.csv --max-por-consulta 10
```

Função:

- varrer web aberta
- detectar sinais públicos de intenção
- registrar título, snippet, URL, fonte e padrão encontrado

---

## 10. Estrutura recomendada de negociação

### Etapa 1 — diagnóstico

- entender gargalo
- medir urgência
- confirmar impacto financeiro ou operacional

### Etapa 2 — proposta curta

- problema atual
- solução proposta
- prazo
- investimento
- próximo passo

### Etapa 3 — fechamento

- entrada
- cronograma
- entregas
- suporte
- evolução futura

---

## 11. Regra de posicionamento final

Você não precisa se vender como programador tradicional.

Você deve se vender como operador de transformação digital aplicada ao negócio.

Valor percebido vem de:

- resolver problema real
- organizar a empresa
- fazer parecer profissional
- automatizar o que trava crescimento
- entregar algo funcionando

---

## 12. Próximas evoluções do painel

- criar CSV mestre de leads
- consolidar contatos de múltiplas fontes
- adicionar score automático
- gerar mensagens por nicho
- separar pipeline por cidade
- criar histórico de negociações
- criar painel visual futuramente em app/web
