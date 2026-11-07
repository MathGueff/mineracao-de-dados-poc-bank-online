# Diagramas Formais em Notação Mermaid — Etapa 2 da POC (Bank OnlineX)

Abaixo estão os **5 diagramas formais em notação Mermaid** correspondentes à **Etapa 2 do cronograma da POC**. Todos foram estruturados rigorosamente com base nas especificações técnicas e nos registros de decisão arquitetural (ADRs-001 a 005) do Bank OnlineX.

---

### 1. Diagrama de Casos de Uso
Mapeia os cinco atores do sistema e suas interações com as funcionalidades da plataforma de investimentos. Destaca o ponto de validação humana obrigatória (*human-in-the-loop*) para as ações geradas pelos Agentes de IA.

```mermaid
flowchart LR
    classDef actor fill:#f9f,stroke:#333,stroke-width:2px;
    classDef usecase fill:#e1f5fe,stroke:#0288d1,stroke-width:1.5px,rx:15,ry:15;

    subgraph Atores ["Atores do Sistema"]
        Cliente["👤 Cliente (Investidor PF)"]:::actor
        Assessor["👨‍💼 Assessor Humano"]:::actor
        AgenteIA["🤖 Agente de IA"]:::actor
        CoreBancario["🏛️ Core Bancário"]:::actor
        MarketData["📈 Provedor Market Data"]:::actor
    end

    subgraph BankOnlineX ["Sistema de Investimentos Bank OnlineX"]
        UC1(["Consultar Catálogo de Produtos"]):::usecase
        UC2(["Simular Investimento"]):::usecase
        UC3(["Emitir Ordem de Compra/Venda"]):::usecase
        UC4(["Acompanhar Carteira & Proventos"]):::usecase
        UC5(["Resgatar Aplicação"]):::usecase
        UC6(["Conversar com Assistente de IA"]):::usecase
        
        UC7(["Aprovar Recomendação da IA (Human-in-the-Loop)"]):::usecase
        UC8(["Ajustar Perfil de Risco (Suitability)"]):::usecase
        UC9(["Revisar Alertas de Compliance"]):::usecase
        
        UC10(["Gerar Recomendação Personalizada (RAG)"]):::usecase
        UC11(["Monitorar Carteira e Rebalanceamento"]):::usecase
        UC12(["Notificar Eventos de Mercado"]):::usecase
        
        UC13(["Reservar Saldo Financeiro"]):::usecase
        UC14(["Liquidar Operação Financeira"]):::usecase
        UC15(["Efetuar Estornos / Compensação"]):::usecase
        
        UC16(["Fornecer Cotações em Tempo Real"]):::usecase
    end

    Cliente --> UC1
    Cliente --> UC2
    Cliente --> UC3
    Cliente --> UC4
    Cliente --> UC5
    Cliente --> UC6

    Assessor --> UC7
    Assessor --> UC8
    Assessor --> UC9

    AgenteIA --> UC10
    AgenteIA --> UC11
    AgenteIA --> UC12

    UC13 <--> CoreBancario
    UC14 <--> CoreBancario
    UC15 <--> CoreBancario

    MarketData --> UC16
```

---

### 2. Diagrama de Componentes
Organizado nas camadas de **Apresentação**, **Serviços (Microsserviços em Kubernetes)** e **Dados/Integração**. Ilustra a comunicação síncrona via API Gateway/BFF, assíncrona via Apache Kafka e a governança de acesso à IA intermediada por servidores **MCP (Model Context Protocol)** (ADR-005).

```mermaid
flowchart TD
    subgraph Apresentacao ["Camada de Apresentação"]
        WebApp["Web App (SPA/PWA Angular/React)"]
        MobileApp["Mobile App (Flutter iOS/Android)"]
        OpenFinance["Portal Open Finance / APIs"]
    end

    subgraph Servicos ["Camada de Serviços (Microsserviços Kubernetes)"]
        APIGW["API Gateway + BFF (AuthN/AuthZ OIDC/JWT & Rate Limit)"]
        OrdensSvc["Serviço de Ordens (Validação & Idempotência)"]
        CarteiraSvc["Serviço de Carteira (CQRS & Posicionamento)"]
        CotacoesSvc["Serviço de Cotações (Streaming Market Data)"]
        ContaSvc["Serviço de Conta (Saldo & Liquidação)"]
        RiscoSvc["Serviço de Risco & Compliance (Suitability & PLD)"]
        AgenteRAG["Agente de Recomendação (RAG & LLM)"]
        Orquestradorn8n["Orquestrador n8n (Automações)"]
    end

    subgraph DadosIntegracao ["Camada de Dados, Mensageria & IA Governada"]
        Kafka[("Apache Kafka (Event Streaming Backbone)")]
        Postgres[("PostgreSQL OLTP (Primário + Réplicas PgBouncer)")]
        Redis[("Redis Cluster (Cache, Sessões & Idempotência)")]
        VectorDB[("Vector DB / Data Lake (RAG & Analytics)")]
        MCPServer["Servidores MCP (Model Context Protocol)"]
    end

    WebApp --> APIGW
    MobileApp --> APIGW
    OpenFinance --> APIGW

    APIGW --> OrdensSvc
    APIGW --> CarteiraSvc
    APIGW --> CotacoesSvc
    APIGW --> AgenteRAG

    OrdensSvc --> RiscoSvc
    OrdensSvc --> Redis
    OrdensSvc --> Kafka

    CarteiraSvc --> Kafka
    CarteiraSvc --> Postgres
    CarteiraSvc --> ContaSvc

    CotacoesSvc --> Redis
    CotacoesSvc --> Kafka

    AgenteRAG --> MCPServer
    MCPServer --> VectorDB
    MCPServer --> Postgres

    Orquestradorn8n --> Kafka
    Orquestradorn8n --> AgenteRAG
```

---

### 3. Diagrama de Sequência — Execução de Ordem de Investimento
Detalha os 12 passos do fluxo transacional síncrono/assíncrono da emissão de ordem até a liquidação. Inclui o tratamento do **fluxo alternativo de saldo insuficiente**, que resulta em evento `OrdemRejeitada` e retorno HTTP 422 sem gerar estados intermediários parciais.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente (App)
    participant APIGW as 🚪 API Gateway
    participant Ordens as 📦 Serviço de Ordens
    participant Risco as 🛡️ Serviço de Risco
    participant Kafka as 🔄 Apache Kafka
    participant Carteira as 💼 Serviço de Carteira
    participant Core as 🏛️ Core Bancário

    Cliente->>APIGW: POST /ordens (JWT Token)
    APIGW->>Ordens: Encaminha requisição (AuthN/AuthZ & Rate Limit validados)
    Ordens->>Risco: Validação síncrona (Limites, Suitability & PLD)
    Risco-->>Ordens: Retorna Aprovação
    Ordens->>Kafka: Publica evento ordens.criadas (Idempotente)
    Kafka->>Carteira: Consome evento ordens.criadas
    
    alt Fluxo Principal: Saldo Suficiente
        Carteira->>Core: Solicita Reserva e Liquidação Financeira
        Core-->>Carteira: Confirma Liquidação com Sucesso
        Carteira->>Kafka: Publica evento PosicaoAtualizada
        Ordens->>Kafka: Publica evento OrdemExecutada
        Kafka-->>Cliente: Notificação Push / WebSocket (Ordem Executada)
        APIGW-->>Cliente: Resposta HTTP 201 Created (ID da Ordem)
    else Fluxo Alternativo: Saldo Insuficiente
        Carteira->>Core: Solicita Reserva e Liquidação Financeira
        Core-->>Carteira: Rejeita (Saldo Insuficiente)
        Carteira->>Kafka: Publica evento OrdemRejeitada
        APIGW-->>Cliente: Resposta HTTP 422 Unprocessable Entity (Saldo Insuficiente)
    end
```

---

### 4. Diagrama de Classes (Modelo de Domínio DDD)
Apresenta os agregados e entidades do domínio sob os princípios de *Domain-Driven Design*. Mapeia os atributos principais, comportamentos e cardinalidades entre `Cliente`, `ContaInvestimento`, `Ordem`, `Ativo`, `Posicao` e `Recomendacao`.

```mermaid
classDiagram
    class Cliente {
        +String id
        +String nome
        +String cpfAnonimizado
        +String perfilRisco
        +String statusKYC
        +consultarPosicao()
    }

    class ContaInvestimento {
        +String id
        +BigDecimal saldoDisponivel
        +BigDecimal saldoReservado
        +reservarSaldo()
        +liberarSaldo()
    }

    class Ordem {
        +String id
        +String tipo
        +String ativo
        +Integer quantidade
        +BigDecimal precoLimite
        +String status
        +String idempotencyKey
        +validarIdempotencia()
    }

    class Ativo {
        +String ticker
        +String classe
        +String grauRisco
        +obterCotacaoAtual()
    }

    class Posicao {
        +String ativo
        +Integer quantidadeMedia
        +BigDecimal precoMedio
        +BigDecimal proventos
        +atualizarPosicao()
    }

    class Recomendacao {
        +String id
        +String teseRAG
        +Float score
        +Boolean aprovacaoHumana
        +registrarAprovacao()
    }

    Cliente "1" -- "1..*" ContaInvestimento : possui
    Cliente "1" -- "0..*" Ordem : emite
    Cliente "1" -- "0..*" Recomendacao : recebe
    ContaInvestimento "1" -- "0..*" Posicao : contem
    Ordem "*" -- "1" Ativo : refere-se
    Recomendacao "*" -- "1" Ativo : recomenda
```

---

### 5. Diagrama de Implantação (Topologia Multi-AZ TO-BE)
Representa a infraestrutura distribuída para atender a **10.000 TPS sustentados (picos de 25.000 TPS)**. Mapeia a borda perimetral com CDN/WAF e Load Balancer L7, a camada de aplicação stateless em Kubernetes (HPA), o backbone de mensageria Apache Kafka, o cache Redis Cluster, a persistência no PostgreSQL OLTP e as plataformas transversais de observabilidade e segurança Zero Trust.

```mermaid
flowchart TD
    subgraph ClienteLayer ["Dispositivos de Cliente"]
        Browser["🌐 Web Browser (SPA/PWA)"]
        Mobile["📱 Mobile App (iOS/Android)"]
    end

    subgraph BordaSecurity ["Borda & Segurança Perimetral"]
        WAF["🛡️ CDN + WAF (Edge Security & DDoS Mitigation)"]
        LB["⚖️ Load Balancer L7 (TLS 1.3 Termination Multi-AZ)"]
    end

    subgraph K8sCluster ["Cluster Kubernetes Gerenciado (Ativo-Ativo / Auto-Scaling)"]
        subgraph WebZone ["Camada Web (Stateless)"]
            Nginx["Cluster Nginx (Reverse Proxy & BFF Proxy)"]
        end
        
        subgraph GatewayZone ["Camada de Gateway"]
            APIGateway["API Gateway Pods (AuthN/AuthZ & Quotas)"]
        end

        subgraph AppZone ["Camada de Microsserviços (Stateless HPA)"]
            SvcOrdens["Serviço de Ordens Pods"]
            SvcCarteira["Serviço de Carteira Pods"]
            SvcCotacoes["Serviço de Cotações Pods"]
            SvcRisco["Serviço de Risco Pods"]
            AgenteIA["Agente Recomendação IA Pods"]
            N8nPod["Orquestrador n8n Pods"]
        end
    end

    subgraph DataEventLayer ["Camada de Dados & Streaming (Multi-AZ)"]
        KafkaCluster[("⚡ Apache Kafka Cluster (Particionado por Cliente)")]
        RedisCluster[("🔥 Redis Cluster (Cache & Idempotência)")]
        PostgresDB[("🐘 PostgreSQL OLTP (Primário + Réplicas PgBouncer)")]
        VectorDataLake[("📊 Vector DB & Data Lake (RAG & CDC Debezium)")]
    end

    subgraph CrossServices ["Serviços Transversais (Observabilidade & Governança)"]
        Obs["📈 Observabilidade (OpenTelemetry / Prometheus / Grafana / ELK)"]
        SecVault["🔐 Segurança (HashiCorp Vault / mTLS / HSM)"]
    end

    Browser --> WAF
    Mobile --> WAF
    WAF --> LB
    LB --> Nginx
    Nginx --> APIGateway
    APIGateway --> AppZone

    AppZone --> KafkaCluster
    AppZone --> RedisCluster
    AppZone --> PostgresDB
    AgenteIA --> VectorDataLake

    AppZone -. Traces & Logs .-> Obs
    AppZone -. Cofre & Chaves .-> SecVault
```

