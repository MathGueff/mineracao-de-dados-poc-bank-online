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
Plano de testes de estresse automatizados (com scripts **k6**) para validação empírica do fluxo crítico (`API Gateway → Serviço de Ordens → Kafka → Serviço de Carteira`) nos cenários de **10.000 TPS (nominal)**, **25.000 TPS (pico)** e **32.500 TPS (ruptura/headroom 30%)**, monitorados via OpenTelemetry, Prometheus/Grafana, Jaeger e ELK:
- 📕 [**Plano de Testes de Carga e Observabilidade — Etapa 4 (PDF)**](./Artefatos/Fase4/fase-4-plano-testes-cargabank-onlinex.pdf)

---

## 📊 Síntese dos Requisitos Não-Funcionais (SLOs)

| ID | Requisito | Meta (SLO) | Solução Arquitetural Adotada |
| :--- | :--- | :--- | :--- |
| **`RNF-01`** | **Disponibilidade** | `99,95%` (≤ 4h22min indispo/ano) | Topologia Multi-AZ Ativo-Ativo (3 AZs), Kafka `RF=3` e failover automático |
| **`RNF-02`** | **Throughput** | `10.000 TPS` sustentados / `25.000 TPS` pico | Sizing projetado para **32.500 TPS (+30% folga)** com K8s HPA + Kafka (48 partições) |
| **`RNF-03`** | **Latência** | `P95 < 300 ms` (leitura) / `P99 < 800 ms` (ordens) | Redis Cluster (12 nós), 3 Réplicas de Leitura PostgreSQL (CQRS) e mensageria assíncrona |
| **`RNF-04`** | **Escalabilidade** | Crescimento de `40% a.a.` sem re-arquitetura | Microsserviços 100% *stateless* (`165 → 236 pods`) e particionamento por `cliente_id` |
| **`RNF-05`** | **Segurança** | TLS 1.3, AES-256 e Zero Trust | CDN + WAF, mTLS interno no Service Mesh, HashiCorp Vault, HSM e governança MCP |
| **`RNF-06`** | **Auditabilidade** | `100%` das ordens com trilha imutável | *Event sourcing* nativo no Kafka + retenção regulatória em Object Storage WORM |
| **`RNF-07`** | **Observabilidade** | `MTTD < 5 min` / `MTTR < 30 min` | Rastreamento distribuído OpenTelemetry + Prometheus/Grafana + ELK + Alertmanager |
| **`RNF-08`** | **Recuperação (DR)** | `RPO ≤ 5 min` / `RTO ≤ 60 min` | Standby síncrono Multi-AZ (`RPO=0` intra-região), réplicas cross-region e runbooks DR |

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
    └── Fase4/
        └── fase-4-plano-testes-cargabank-onlinex.pdf
```

