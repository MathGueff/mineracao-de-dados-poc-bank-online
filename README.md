# POC — Arquitetura de Investimentos Financeiros de Alta Transação (Bank OnlineX)

Este repositório reúne a documentação técnica e os artefatos gerados na **Prova de Conceito (POC-ARQ-2026-001)** de Arquitetura de Análise de Projetos e Sistemas para a nova plataforma de **Investimentos Financeiros do Bank OnlineX**.

---

## 📌 Sobre a POC (Resumo Executivo)

A POC tem como objetivo validar uma arquitetura de referência (*TO-BE*) capaz de sustentar operações financeiras de alta frequência em um banco digital, absorvendo picos severos de abertura e fechamento de mercado com resiliência, rastreabilidade regulatória (BACEN/LGPD) e integração segura com Inteligência Artificial.

### Principais Diretrizes e Pilares Técnicos
- **Alta Volumetria e Desempenho:** Sustentação nominal de **10.000 TPS**, picos de mercado de **25.000 TPS** e infraestrutura dimensionada com **+30% de margem de segurança (32.500 TPS)**, mantendo latências **P95 < 300 ms** para consultas e **P99 < 800 ms** para emissão de ordens.
- **Resiliência e Escalabilidade Multi-AZ:** Implantação **Ativo-Ativo em 3 Zonas de Disponibilidade (SLA de 99,95%)** com microsserviços *stateless* em **Kubernetes (HPA)**, escalando de **165 pods (baseline)** para **236 pods (pico)** sem afinidade de sessão (**ADR-002**).
- **Arquitetura Orientada a Eventos e CQRS:** Desacoplamento transacional e *event sourcing* via **Apache Kafka** com retenção imutável WORM (**ADR-001**), **API Gateway + BFF** centralizado (**ADR-003**) e leituras de carteira otimizadas via **CQRS leve** sobre **Redis Cluster** e réplicas de leitura **PostgreSQL** (**ADR-004**).
- **Ecossistema de IA Governado via MCP:** Integração entre **LLMs**, **Agentes Autônomos**, **RAG** (busca semântica sobre lâminas e normativos) e **n8n**, onde todo acesso a dados e ferramentas ocorre exclusivamente por servidores **MCP (*Model Context Protocol*)** com validação humana obrigatória (*human-in-the-loop*) para ações críticas (**ADR-005**).
- **Metodologia Assistida por IA (*Grounding*):** Uso do **Google NotebookLM** como camada de *RAG* sobre fontes técnicas anonimizadas para geração assistida e rastreável da modelagem UML e dos memoriais de engenharia.

---

## 📂 Navegação pelos Artefatos da POC

### 📄 Documento Base da POC
- [**POC — Documentação de Arquitetura de Investimentos Bank OnlineX (v1.0)**](./POC_Documentação-Arquitetura_Investimentos_Bank_OnlineX-04Nov2026-v1.pdf) — Especificação completa da POC, requisitos funcionais e não-funcionais, arquitetura *TO-BE* e *AS-IS* (IA), ADRs, metodologia com NotebookLM, cronograma e matriz de riscos.

---

### 🔹 [Fase 1 — Preparação, Especificação de Requisitos e Grounding](./Artefatos/Fase1/)
Consolidação da base documental para ingestão no NotebookLM, diretrizes de negócio, catálogo de Requisitos Não-Funcionais (`RNF-01` a `RNF-08`), decisões arquiteturais (`ADR-001` a `ADR-005`) e KPIs de aceite.
- 📕 [**Especificação Técnica de Requisitos e Arquitetura de Referência (PDF)**](./Artefatos/Fase1/fase-1-especificacao-requisitos-arquitetura-bank-onlinex.pdf)

---

### 🔹 [Fase 2 — Modelagem e Documentação UML](./Artefatos/Fase2/)
Pacote completo com os **5 diagramas UML formais** da arquitetura do Bank OnlineX, disponíveis tanto em notação **Mermaid (Markdown)** quanto em arquivos editáveis do **draw.io (`.drawio`)**:
- 📝 [**Documentação Consolidada dos Diagramas UML em Mermaid (Markdown)**](./Artefatos/Fase2/Diagramas_Etapa2_Bank_OnlineX.md)
- 🗂️ [**Arquivo Consolidado Multipágina — Todos os 5 Diagramas (`.drawio`)**](./Artefatos/Fase2/Diagramas_Etapa2_Bank_OnlineX.drawio)
- **Diagramas Individuais (`.drawio`):**
  1. [**01 — Diagrama de Casos de Uso**](./Artefatos/Fase2/01_Casos_de_Uso_Bank_OnlineX.drawio) *(Cliente, Assessor Humano, Agente de IA, Core Bancário e Market Data)*
  2. [**02 — Diagrama de Componentes**](./Artefatos/Fase2/02_Componentes_Bank_OnlineX.drawio) *(Camadas de Apresentação, Microsserviços K8s e Dados/IA via MCP)*
  3. [**03 — Diagrama de Sequência — Execução de Ordem**](./Artefatos/Fase2/03_Sequencia_Execucao_Ordem_Bank_OnlineX.drawio) *(Fluxo transacional de 12 passos + fluxo alternativo de saldo insuficiente HTTP 422)*
  4. [**04 — Diagrama de Classes (Modelo de Domínio DDD)**](./Artefatos/Fase2/04_Classes_DDD_Bank_OnlineX.drawio) *(Agregados `Cliente`, `ContaInvestimento`, `Ordem`, `Ativo`, `Posicao` e `Recomendacao`)*
  5. [**05 — Diagrama de Implantação Multi-AZ**](./Artefatos/Fase2/05_Implantacao_MultiAZ_Bank_OnlineX.drawio) *(Mapeamento de nós e artefatos na infraestrutura distribuída)*

---

### 🔹 [Fase 3 — Topologia Multi-AZ e Sizing de Infraestrutura](./Artefatos/Fase3/)
Dimensionamento detalhado de capacidade (computação, memória, rede, partições Kafka e IOPS de banco) para atender aos SLOs com **+30% de folga (*headroom* de 32.500 TPS)** em 3 Zonas de Disponibilidade:
- 📝 [**Memorial Detalhado de Cálculo de Sizing e Topologia Multi-AZ (Markdown)**](./Artefatos/Fase3/Memorial_Detalhado_Sizing_e_Topologia_Etapa3.md)
- 📕 [**Relatório Executivo de Topologia e Sizing — Etapa 3 (PDF)**](./Artefatos/Fase3/fase-3-relatorio-sizing-bank-onlinex.pdf)
- 📊 [**Planilha de Dimensionamento de Infraestrutura — Sizing Matrix (`.xlsx`)**](./Artefatos/Fase3/fase-3-sizing--bank-onlinex.xlsx)
- 🗺️ [**Diagrama de Topologia Multi-AZ Dimensionada (`.drawio`)**](./Artefatos/Fase3/Topologia_MultiAZ_Sizing_Fase3_Bank_OnlineX.drawio)

---

### 🔹 [Fase 4 — Protótipo de Carga, Testes de Estresse e Observabilidade](./Artefatos/Fase4/)
Especificação do protótipo funcional mínimo (`API Gateway → Serviço de Ordens → Kafka → Serviço de Carteira`), suíte de automação em **k6** e relatório de resultados aferidos nos cenários de **10.000 TPS (nominal)**, **25.000 TPS (pico)**, **32.500 TPS (+30% folga)** e **62.500 TPS (estresse limite 2,5×)**, monitorados via OpenTelemetry, Prometheus/Grafana, Jaeger e ELK (`KPI-01` e `RNF-07`):
- 📝 [**Relatório de Execução de Carga e Especificação do Protótipo Funcional (Markdown)**](./Artefatos/Fase4/Relatorio_Execucao_Carga_e_Prototipo_Etapa4.md)
- 📕 [**Plano de Testes de Carga e Observabilidade — Etapa 4 (PDF)**](./Artefatos/Fase4/fase-4-plano-testes-cargabank-onlinex.pdf)
- 💻 [**Suíte de Teste de Carga e Estresse Multi-Cenário (`k6_load_test_etapa4.js`)**](./Artefatos/Fase4/k6_load_test_etapa4.js)

---

### 🔹 [Fase 5 — Integração com IA e Governança MCP](./Artefatos/Fase5/)
Demonstração ponta a ponta do ecossistema de Inteligência Artificial governada (**LLMs**, **Agentes Autônomos**, **Pipelines de RAG**, **Orquestrador n8n** com *retry/DLQ* e **Servidores MCP — `ADR-005`**), incluindo contratos JSON-RPC 2.0, geração do agregado `Recomendacao` com citação obrigatória de fontes e aprovação *Human-in-the-Loop* pelo Assessor Humano (`KPI-04`):
- 📝 [**Memorial Técnico da Demo Ponta a Ponta de Integração com IA e Governança MCP (Markdown)**](./Artefatos/Fase5/Memorial_Demo_Integracao_IA_e_Governanca_MCP_Etapa5.md)
- 📕 [**Plano de Integração com IA e Governança MCP — Etapa 5 (PDF)**](./Artefatos/Fase5/fase-5-plano-integracao-ia-bank-onlinex.pdf)
- 🗺️ [**Diagrama de Arquitetura de Integração IA e Governança MCP (`.drawio`)**](./Artefatos/Fase5/Arquitetura_Integracao_IA_MCP_Fase5_Bank_OnlineX.drawio)

---

## 📊 Síntese dos Requisitos Não-Funcionais (SLOs) e KPIs

| ID | Requisito / Indicador | Meta Oficial (SLO / KPI) | Solução Arquitetural e Validação na POC |
| :--- | :--- | :--- | :--- |
| **`RNF-01`** | **Disponibilidade** | `99,95%` (≤ 4h22min indispo/ano) | Topologia Multi-AZ Ativo-Ativo (3 AZs), Kafka `RF=3` e failover automático |
| **`RNF-02`** | **Throughput** | `10.000 TPS` sustentados / `25.000 TPS` pico | Sizing projetado e testado para **32.500 TPS (+30% folga)** com K8s HPA + Kafka (48 partições) |
| **`RNF-03`** | **Latência** | `P95 < 300 ms` (leitura) / `P99 < 800 ms` (ordens) | Redis Cluster (12 nós), 3 Réplicas de Leitura PostgreSQL (CQRS) e mensageria assíncrona |
| **`RNF-04`** | **Escalabilidade** | Crescimento de `40% a.a.` sem re-arquitetura | Microsserviços 100% *stateless* (`165 → 236 pods`) e particionamento por `cliente_id` |
| **`RNF-05`** | **Segurança** | TLS 1.3, AES-256 e Zero Trust | CDN + WAF, mTLS interno, HashiCorp Vault, HSM, filtro DLP e isolamento via MCP (`ADR-005`) |
| **`RNF-06`** | **Auditabilidade** | `100%` das ordens e ações IA com trilha imutável | *Event sourcing* nativo no Kafka + retenção regulatória em Object Storage WORM |
| **`RNF-07`** | **Observabilidade** | `MTTD < 5 min` / `MTTR < 30 min` | OpenTelemetry + Prometheus/Grafana + Jaeger + ELK + Alertmanager (`MTTD = 1m42s`) |
| **`RNF-08`** | **Recuperação (DR)** | `RPO ≤ 5 min` / `RTO ≤ 60 min` | Standby síncrono Multi-AZ (`RPO=0` intra-região), réplicas cross-region e runbooks DR |
| **`KPI-01`** | **Desempenho MVP** | `10.000 TPS` com `P99 < 800 ms` sustentados | Homologado na Fase 4 (`P99 = 380 ms` em `10k TPS` e `P99 = 742 ms` em `32,5k TPS`) |
| **`KPI-04`** | **IA Governada** | `100%` citações RAG + aprovação humana | Homologado na Fase 5 via servidores MCP, guardrails e evento assinado `RecomendacaoAprovada` |

---

## 🗂️ Estrutura do Repositório

```text
├── POC_Documentação-Arquitetura_Investimentos_Bank_OnlineX-04Nov2026-v1.pdf
├── README.md
├── LICENSE
└── Artefatos/
    ├── Fase1/
    │   └── fase-1-especificacao-requisitos-arquitetura-bank-onlinex.pdf
    ├── Fase2/
    │   ├── 01_Casos_de_Uso_Bank_OnlineX.drawio
    │   ├── 02_Componentes_Bank_OnlineX.drawio
    │   ├── 03_Sequencia_Execucao_Ordem_Bank_OnlineX.drawio
    │   ├── 04_Classes_DDD_Bank_OnlineX.drawio
    │   ├── 05_Implantacao_MultiAZ_Bank_OnlineX.drawio
    │   ├── Diagramas_Etapa2_Bank_OnlineX.drawio
    │   └── Diagramas_Etapa2_Bank_OnlineX.md
    ├── Fase3/
    │   ├── Memorial_Detalhado_Sizing_e_Topologia_Etapa3.md
    │   ├── Topologia_MultiAZ_Sizing_Fase3_Bank_OnlineX.drawio
    │   ├── fase-3-relatorio-sizing-bank-onlinex.pdf
    │   └── fase-3-sizing--bank-onlinex.xlsx
    ├── Fase4/
    │   ├── Relatorio_Execucao_Carga_e_Prototipo_Etapa4.md
    │   ├── fase-4-plano-testes-cargabank-onlinex.pdf
    │   └── k6_load_test_etapa4.js
    └── Fase5/
        ├── Arquitetura_Integracao_IA_MCP_Fase5_Bank_OnlineX.drawio
        ├── Memorial_Demo_Integracao_IA_e_Governanca_MCP_Etapa5.md
        └── fase-5-plano-integracao-ia-bank-onlinex.pdf
```
