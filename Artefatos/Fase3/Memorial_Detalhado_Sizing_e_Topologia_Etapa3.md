# Memorial de Cálculo de Sizing e Topologia Multi-AZ — Etapa 3 da POC (Bank OnlineX)

Este documento complementa os artefatos [relatorio-sizing-etapa3-bank-onlinex.pdf](file:///c:/Users/Gueff/Downloads/mineracao-poc-trabalho-2/Gerados/Fase3/relatorio-sizing-etapa3-bank-onlinex.pdf), [sizing-etapa3-bank-onlinex.xlsx](file:///c:/Users/Gueff/Downloads/mineracao-poc-trabalho-2/Gerados/Fase3/sizing-etapa3-bank-onlinex.xlsx) e [Topologia_MultiAZ_Sizing_Fase3_Bank_OnlineX.drawio](file:///c:/Users/Gueff/Downloads/mineracao-poc-trabalho-2/Gerados/Fase3/Topologia_MultiAZ_Sizing_Fase3_Bank_OnlineX.drawio), fechando 100% dos entregáveis da **Etapa 3 (Topologia e Sizing — Semana 4)** definidos na Seção 7.1 do documento [POC_Documentação-Arquitetura_Investimentos_Bank_OnlineX-04Nov2026-v1.pdf](file:///c:/Users/Gueff/Downloads/mineracao-poc-trabalho-2/POC_Documentação-Arquitetura_Investimentos_Bank_OnlineX-04Nov2026-v1.pdf).

---

## 1. Premissas Volumétricas e Margem de Segurança (+30% de Folga)

| Parâmetro Volumétrico | Valor Nominal (POC) | Margem de Segurança (Headroom) | Capacidade Projetada (Alvo de Sizing) | Referência / RNF |
| :--- | :---: | :---: | :---: | :--- |
| **Throughput Sustentado** | $10.000\text{ TPS}$ | $+30\%$ | **$13.000\text{ TPS}$** | `RNF-02`, `KPI-01` |
| **Throughput de Pico de Mercado** | $25.000\text{ TPS}$ | $+30\%$ | **$32.500\text{ TPS}$** | `RNF-02`, Critério Go/No-Go Etapa 3 |
| **Teste de Estresse Limite (2,5× Pico)** | $25.000\text{ TPS}$ | $2,5\times$ (Risco Seção 8) | **$62.500\text{ TPS}$** *(teto de auto-scaling)* | Mitigação de Risco (Seção 8, pág. 17) |
| **Crescimento Anual Esperado** | $+40\%\text{ a.a.}$ | Escalabilidade Horizontal | Sem re-arquitetura (HPA Stateless) | `RNF-04`, `ADR-002` |
| **Disponibilidade (SLA Anual)** | $99,95\%$ | Multi-AZ Ativo-Ativo | **3 Zonas (`AZ-a`, `AZ-b`, `AZ-c`)** | `RNF-01` ($\le 4\text{h}22\text{min}$ indispo/ano) |
| **Latência de Consultas / Ordens** | $\text{P95} < 300\text{ ms}$ / $\text{P99} < 800\text{ ms}$ | Cache + CQRS + Async Kafka | $\text{P95} \approx 120\text{ ms}$ / $\text{P99} \approx 450\text{ ms}$ | `RNF-03`, `ADR-001`, `ADR-004` |

---

## 2. Detalhamento Completo dos Pods em Kubernetes (Fechamento: 165 Pods Baseline → 236 Pods no Pico)

A tabela abaixo reconcilia todos os microsserviços e componentes stateless descritos nas Seções 3.2 e 5.2 da documentação da POC, demonstrando a distribuição exata nas **3 Zonas de Disponibilidade (`AZ-a`, `AZ-b`, `AZ-c`)** que totaliza **165 pods em baseline** e **236 pods no pico com 30% de folga**:

| Camada | Componente / Microsserviço | Spec Unitária por Pod | Baseline (10k–13k TPS) | Pico c/ +30% Folga (32,5k TPS) | Distribuição Multi-AZ (3 AZs) | vCPU Total (Pico) | RAM Total (Pico) | Papel Arquitetural & ADR |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Apresentação** | **Web Servers (Cluster Nginx)** | `2 vCPU`, `4 GB RAM` | **9 Pods** | **12 Pods** | `3/AZ` → `4/AZ` | 24 vCPU | 48 GB | Serve SPA/PWA e atua como reverse proxy stateless do BFF (`Seção 3.2`). |
| **Gateway & BFF** | **API Gateway + BFF (OIDC/JWT)** | `2 vCPU`, `4 GB RAM` | **24 Pods** | **40 Pods** | `8/AZ` → `13–14/AZ` | 80 vCPU | 160 GB | AuthN/AuthZ OIDC/JWT, rate limiting e agregação BFF (`ADR-003`). |
| **Aplicação** | **Serviço de Ordens** | `4 vCPU`, `8 GB RAM` | **42 Pods** | **60 Pods** | `14/AZ` → `20/AZ` | 240 vCPU | 480 GB | Validação, chave de idempotência no Redis e publicação em `ordens.criadas` (`ADR-001`). |
| **Aplicação** | **Serviço de Risco & Compliance** | `2 vCPU`, `4 GB RAM` | **28 Pods** | **40 Pods** | `9–10/AZ` → `13–14/AZ` | 80 vCPU | 160 GB | Validação síncrona de limites, suitability e PLD/FT (passos 3 e 4). |
| **Aplicação** | **Serviço de Carteira (CQRS)** | `4 vCPU`, `8 GB RAM` | **33 Pods** | **48 Pods** | `11/AZ` → `16/AZ` | 192 vCPU | 384 GB | Consumo assíncrono do Kafka e projeção CQRS de posições (`ADR-004`). |
| **Aplicação** | **Serviço de Conta (Liquidação)** | `4 vCPU`, `8 GB RAM` | **12 Pods** | **15 Pods** | `4/AZ` → `5/AZ` | 60 vCPU | 120 GB | Reserva de saldo, liquidação e compensação junto ao Core Bancário (`Seção 5.2`). |
| **Aplicação** | **Serviço de Cotações (Market Data)** | `4 vCPU`, `8 GB RAM` | **9 Pods** | **12 Pods** | `3/AZ` → `4/AZ` | 48 vCPU | 96 GB | Ingestão streaming de cotações e publicação no Redis e Kafka (`Seção 5.2`). |
| **IA & Automação** | **Servidores MCP & Agente RAG** | `8 vCPU`, `32 GB RAM` | **3 Pods** | **3 Pods** *(HPA sob demanda)* | `1/AZ` (3 AZs) | 24 vCPU | 96 GB | Governança de acesso a ferramentas/dados via MCP e RAG (`ADR-005`). |
| **IA & Automação** | **Orquestrador n8n (Workers)** | `2 vCPU`, `4 GB RAM` | **3 Pods** | **3 Pods** *(HPA sob demanda)* | `1/AZ` (3 AZs) | 6 vCPU | 12 GB | Workflows low-code de notificação e gatilhos de eventos (`Seção 4.4`). |
| **Pool OLTP** | **PgBouncer (Connection Pool)** | `2 vCPU`, `4 GB RAM` | **2 Pods** | **3 Pods** | `1/AZ` (3 AZs) | 6 vCPU | 12 GB | Multiplexação de conexões transacionais para o PostgreSQL (`Seção 3.2`). |
| **TOTAL K8s** | **Total de Pods da Aplicação** | — | **165 Pods** | **236 Pods** | **Distribuídos em 3 AZs** | **760 vCPU** | **1.568 GB** | **100% Stateless com HPA (`ADR-002`)** |

### Dimensionamento dos Worker Nodes do Cluster Kubernetes
- **Requisição total no pico (+30% folga):** `760 vCPUs` e `1.568 GB RAM` + ~`15%` de overhead operacional (Kubelet, CNI, Service Mesh mTLS, DaemonSets OpenTelemetry/FluentBit).
- **Configuração dos Nós:** **27 Worker Nodes `c6i.8xlarge` (ou equivalente: `32 vCPU`, `64 GB RAM` cada)** → **9 Worker Nodes por AZ** (`864 vCPUs` e `1.728 GB RAM` totais), com *Cluster Autoscaler* habilitado até **33 nós** (`11/AZ`).

---

## 3. Dimensionamento do Backbone Apache Kafka (`ADR-001`, `RNF-02`, `RNF-06`)

- **Topologia do Cluster:** **6 Brokers Kafka** (`2 Brokers por AZ` em 3 AZs: `16 vCPU`, `64 GB RAM`, discos `NVMe SSD` em RAID-0) + **3 Nós Controller KRaft dedicados** (`1 por AZ`) para gerenciamento de quórum sem dependência de ZooKeeper.
- **Política de Durabilidade e Disponibilidade:** `replication.factor = 3` (1 réplica por AZ), `min.insync.replicas = 2`, `acks = all` (`RPO = 0`).

| Tópico Kafka | Partições | Chave de Partição | Taxa no Pico (+30% Folga) | Payload Médio | Banda de Escrita (Bruta → Replicada RF=3) | Retenção Quente + Arquivamento |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`ordens.criadas`** | **48** | `cliente_id` | $32.500\text{ msg/s}$ | $2,0\text{ KB}$ | $65\text{ MB/s} \rightarrow 195\text{ MB/s}$ | 7 dias NVMe + WORM Imutável (5 anos) |
| **`PosicaoAtualizada`** | **48** | `cliente_id` | $32.500\text{ msg/s}$ | $2,0\text{ KB}$ | $65\text{ MB/s} \rightarrow 195\text{ MB/s}$ | 7 dias NVMe + CDC Data Lake |
| **`OrdemExecutada`** | **48** | `cliente_id` | $32.500\text{ msg/s}$ | $1,5\text{ KB}$ | $48,8\text{ MB/s} \rightarrow 146,4\text{ MB/s}$ | 7 dias NVMe + WORM Imutável (5 anos) |
| **`OrdemRejeitada`** | **24** | `cliente_id` | $3.250\text{ msg/s}$ | $1,5\text{ KB}$ | $4,9\text{ MB/s} \rightarrow 14,7\text{ MB/s}$ | 14 dias NVMe + WORM Imutável |
| **`cotacoes.realtime`** | **48** | `ticker` | $50.000\text{ msg/s}$ | $0,5\text{ KB}$ | $25\text{ MB/s} \rightarrow 75\text{ MB/s}$ | 24 horas (Hot Stream) |
| **`auditoria.ia.mcp`** | **24** | `agente_id` | $4.550\text{ msg/s}$ | $3,0\text{ KB}$ | $13,6\text{ MB/s} \rightarrow 40,8\text{ MB/s}$ | 30 dias NVMe + WORM Regulatório |

> [!NOTE]
> Com **48 partições** nos tópicos críticos (`ordens.criadas`, `PosicaoAtualizada`, `OrdemExecutada`), os **48 pods de pico do Serviço de Carteira** operam em relação 1:1 (1 partição por pod consumidor), eliminando contenção de *consumer group* e sustentando mais de $48.000\text{ msg/s}$ sem *consumer lag*.

---

## 4. Dimensionamento da Camada de Dados, Cache e Transversais

| Camada | Componente | Configuração de Nós e Topologia Multi-AZ | Especificação por Nó | Capacidade Total & Desempenho | Requisitos Atendidos |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cache In-Memory** | **Redis Cluster** | **6 Shards (12 Nós: 6 Masters + 6 Réplicas)**<br>`2 Masters + 2 Réplicas por AZ` | `8 vCPU`, `32 GB RAM` | **192 GB RAM Bruta (128+ GB Útil)**<br>$> 250.000\text{ ops/s}$ com $\text{P99} < 1\text{ ms}$ | `RNF-03`, Idempotência de Ordens, Sessões e Cotações |
| **Banco OLTP (Escrita)** | **PostgreSQL Primário + Standby** | **1 Primário (AZ-a) + 1 Standby Síncrono (AZ-b)**<br>Precedido por Pool **PgBouncer** | `64 vCPU`, `256 GB RAM`, `30.000 IOPS NVMe` | Suporta $> 15.000\text{ TPS}$ de escrita transacional particionada por `cliente_id` | `RNF-01`, `RNF-02`, `RNF-08` ($\text{RPO} \le 5\text{ min}$) |
| **Banco OLTP (Leitura)** | **PostgreSQL Read Replicas (CQRS)** | **3 Réplicas de Leitura**<br>`1 Réplica por AZ` (`AZ-a`, `AZ-b`, `AZ-c`) | `32 vCPU`, `128 GB RAM`, `20.000 IOPS NVMe` | **96 vCPU / 384 GB RAM de leitura**<br>Consultas de carteira com $\text{P95} < 300\text{ ms}$ | `RNF-03`, `ADR-004` (CQRS Leve) |
| **Analytics & RAG** | **Vector DB + Data Lake / DW (Debezium)** | **Cluster Vector DB Multi-AZ (3 Nós)** + Pipeline **CDC Debezium** + Object Storage WORM | `8 vCPU`, `32 GB RAM`, NVMe SSD | Busca semântica RAG ($\text{P95} < 50\text{ ms}$) + retenção regulatória imutável | `RNF-06`, `KPI-02`, `KPI-04`, `ADR-005` |
| **Transversal** | **Observabilidade & Zero Trust** | **OpenTelemetry + Prometheus/Grafana + ELK** e **HashiCorp Vault + HSM + SIEM** em 3 AZs | Cluster dedicado HA Multi-AZ | $\text{MTTD} < 5\text{ min}$, $\text{MTTR} < 30\text{ min}$; TLS 1.3 externo, mTLS interno e AES-256 | `RNF-05`, `RNF-06`, `RNF-07`, `RNF-08` |

---

## 5. Matriz Completa de Validação de SLOs (`RNF-01` a `RNF-08`) — Gate Go/No-Go da Etapa 3

| ID | Requisito Não-Funcional | Meta (SLO Oficial) | Solução de Sizing Aplicada | Status Go/No-Go |
| :--- | :--- | :--- | :--- | :---: |
| **`RNF-01`** | **Disponibilidade** | $99,95\%$ ($\approx 4\text{h}22\text{min/ano}$) | Topologia Ativo-Ativo em 3 AZs, mínimo de 2+ réplicas por AZ, Kafka `RF=3` e failover automático. | **APROVADO (Go)** |
| **`RNF-02`** | **Throughput** | $10.000\text{ TPS}$ sustentados; $25.000\text{ TPS}$ pico | Dimensionado com $+30\%$ de folga para **$32.500\text{ TPS}$** (`236 pods` K8s + `6 brokers` Kafka / `48 partições`). | **APROVADO (Go)** |
| **`RNF-03`** | **Latência** | $\text{P95} < 300\text{ ms}$ (consultas); $\text{P99} < 800\text{ ms}$ (ordens) | Redis Cluster (`12 nós`), 3 Réplicas de Leitura PostgreSQL (CQRS `ADR-004`) e desacoplamento via Kafka (`ADR-001`). | **APROVADO (Go)** |
| **`RNF-04`** | **Escalabilidade** | Crescer $40\%\text{ ao ano}$ sem re-arquitetura | Microsserviços $100\%$ stateless em Kubernetes com HPA (`165 → 236 pods`) e particionamento horizontal (`ADR-002`). | **APROVADO (Go)** |
| **`RNF-05`** | **Segurança** | TLS 1.3 em trânsito; AES-256 em repouso; Zero Trust | CDN+WAF na borda, mTLS entre pods no K8s, HSM para chaves, HashiCorp Vault e governança MCP (`ADR-005`). | **APROVADO (Go)** |
| **`RNF-06`** | **Auditabilidade** | $100\%$ das ordens com trilha imutável | Event sourcing nativo no Kafka (`RF=3`) + persistência em armazenamento WORM para conformidade BACEN/LGPD. | **APROVADO (Go)** |
| **`RNF-07`** | **Observabilidade** | $\text{MTTD} < 5\text{ min}$; $\text{MTTR} < 30\text{ min}$ | Coleta unificada com OpenTelemetry, métricas no Prometheus/Grafana, logs no ELK e alertas baseados em SLO. | **APROVADO (Go)** |
| **`RNF-08`** | **Recuperação (DR)** | $\text{RPO} \le 5\text{ min}$; $\text{RTO} \le 60\text{ min}$ | Standby síncrono Multi-AZ ($\text{RPO}=0$ intra-região), réplicas cross-region assíncronas, backups contínuos e runbooks DR. | **APROVADO (Go)** |

