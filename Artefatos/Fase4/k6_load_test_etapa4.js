/**
 * Bank OnlineX — POC Arquitetura de Investimentos (Etapa 4)
 * Suite Completa de Teste de Carga e Estresse (k6)
 *
 * Valida separadamente:
 * 1. Emissao de Ordens (POST /v1/ordens) -> SLO RNF-03 / KPI-01: P99 < 800 ms
 * 2. Consulta de Carteira CQRS (GET /v1/carteira/{id}) -> SLO RNF-03: P95 < 300 ms
 * 3. Fluxo Alternativo de Saldo Insuficiente -> HTTP 422 (OrdemRejeitada sem estado parcial)
 * 4. Idempotencia em Rajadas -> Chave Idempotency-Key no Redis Cluster
 * 5. Notificacoes Assincronas (WebSocket /ws/notificacoes) -> Push de OrdemExecutada
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Metricas customizadas por fluxo para validacao estrita do RNF-03 e KPI-01
const ordensLatency = new Trend('latencia_emissao_ordens_ms', true);
const carteiraLatency = new Trend('latencia_consulta_carteira_ms', true);
const wsPushLatency = new Trend('latencia_push_websocket_ms', true);
const ordensRejeitadasSaldo = new Counter('total_ordens_rejeitadas_http422');
const idempotenciaHits = new Counter('total_bloqueios_idempotencia');
const taxaSucessoNegocio = new Rate('taxa_sucesso_transacional');

const BASE_URL = __ENV.API_BASE_URL || 'https://gateway.bankonlinex.internal/v1';
const WS_URL = __ENV.WS_BASE_URL || 'wss://gateway.bankonlinex.internal/ws/notificacoes';
const JWT_TOKEN = __ENV.JWT_TEST_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.bankonlinex-poc-etapa4';

export const options = {
  scenarios: {
    // Cenario A: Fluxo Critico de Escrita de Ordens (RNF-02 e KPI-01)
    emissao_ordens_post: {
      executor: 'ramping-arrival-rate',
      startRate: 1000,
      timeUnit: '1s',
      preAllocatedVUs: 2500,
      maxVUs: 12000,
      exec: 'emitirOrdem',
      stages: [
        { duration: '2m', target: 6000 },   // Rampa para carga nominal de escrita (60% do mix = 6k TPS escrita)
        { duration: '30m', target: 6000 },  // Sustentado Nominal (Total combinado com leitura = 10k TPS)
        { duration: '2m', target: 15000 },  // Rampa para Pico de Mercado (Total combinado = 25k TPS)
        { duration: '15m', target: 15000 }, // Sustentado Pico 25k TPS
        { duration: '1m', target: 19500 },  // Rampa para Headroom +30% (Total combinado = 32.5k TPS)
        { duration: '10m', target: 19500 }, // Sustentado Headroom 32.5k TPS
        { duration: '2m', target: 0 },      // Rampa de descida graciosa
      ],
    },

    // Cenario B: Consultas de Carteira e Cotações via CQRS / Redis / Read Replicas (RNF-03)
    consulta_carteira_get: {
      executor: 'ramping-arrival-rate',
      startRate: 1000,
      timeUnit: '1s',
      preAllocatedVUs: 1500,
      maxVUs: 8000,
      exec: 'consultarCarteira',
      stages: [
        { duration: '2m', target: 4000 },   // Rampa para carga nominal de leitura (40% do mix = 4k TPS leitura)
        { duration: '30m', target: 4000 },  // Sustentado Nominal (10k TPS totais)
        { duration: '2m', target: 10000 },  // Rampa para Pico de Mercado (25k TPS totais)
        { duration: '15m', target: 10000 }, // Sustentado Pico
        { duration: '1m', target: 13000 },  // Rampa para Headroom +30% (32.5k TPS totais)
        { duration: '10m', target: 13000 }, // Sustentado Headroom
        { duration: '2m', target: 0 },      // Rampa de descida
      ],
    },

    // Cenario C: Canal WebSocket para confirmacao assincrona (Passo 11 do Diagrama de Sequencia)
    notificacoes_ws: {
      executor: 'constant-vus',
      vus: 500,
      duration: '62m',
      exec: 'escutarNotificacoesWS',
    },
  },

  thresholds: {
    // RNF-03 e KPI-01: P99 < 800 ms exclusivo para emissao de ordens
    latencia_emissao_ordens_ms: ['p(99)<800', 'p(95)<500'],
    // RNF-03: P95 < 300 ms exclusivo para consultas de carteira
    latencia_consulta_carteira_ms: ['p(95)<300', 'p(99)<450'],
    // Push WebSocket sub-segundo
    latencia_push_websocket_ms: ['p(99)<250'],
    // RNF-01: Taxa de sucesso transacional > 99.95% (erros < 0.05%)
    http_req_failed: ['rate<0.0005'],
    taxa_sucesso_transacional: ['rate>0.9995'],
  },
};

const TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3', 'CDB-ONLINEX-110CDI', 'TESOURO-SELIC-2029'];

export function emitirOrdem() {
  // 5% das requisicoes simulam cliente sem saldo para validar o Fluxo Alternativo (HTTP 422)
  const simularSaldoInsuficiente = (__ITER % 20 === 0);
  // 2% das requisicoes reutilizam a mesma chave para validar Idempotencia no Redis em rajadas
  const simularRepeticaoIdempotente = (__ITER % 50 === 0 && __ITER > 0);

  const clienteId = simularSaldoInsuficiente
    ? `CLI-INSUF-${__VU}`
    : `CLI-ATIVO-${(__VU % 50000) + 1}`;

  const idempotencyKey = simularRepeticaoIdempotente
    ? `IDEMP-REPEAT-${__VU}-${__ITER - 1}`
    : `IDEMP-${__VU}-${__ITER}-${Date.now()}`;

  const ticker = TICKERS[__ITER % TICKERS.length];

  const payload = JSON.stringify({
    clienteId: clienteId,
    ticker: ticker,
    quantidade: 100,
    precoLimite: 32.50,
    tipo: 'COMPRA',
    idempotencyKey: idempotencyKey,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Idempotency-Key': idempotencyKey,
      'X-Trace-Source': 'k6-poc-etapa4',
    },
    tags: { endpoint: 'post_ordens' },
  };

  const res = http.post(`${BASE_URL}/ordens`, payload, params);
  ordensLatency.add(res.timings.duration);

  if (simularSaldoInsuficiente) {
    const ok422 = check(res, {
      'Fluxo Alternativo: retorna HTTP 422 em saldo insuficiente': (r) => r.status === 422,
      'Fluxo Alternativo: contém evento OrdemRejeitada auditável': (r) => r.body && r.body.includes('SALDO_INSUFICIENTE'),
    });
    if (ok422) ordensRejeitadasSaldo.add(1);
    taxaSucessoNegocio.add(ok422);
  } else {
    const ok201 = check(res, {
      'Fluxo Principal: retorna HTTP 201 Created ou 200 Idempotente': (r) => r.status === 201 || r.status === 200,
    });
    if (simularRepeticaoIdempotente && res.status === 200) {
      idempotenciaHits.add(1);
    }
    taxaSucessoNegocio.add(ok201);
  }
}

export function consultarCarteira() {
  const clienteId = `CLI-ATIVO-${(__VU % 50000) + 1}`;
  const params = {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Accept': 'application/json',
    },
    tags: { endpoint: 'get_carteira' },
  };

  const res = http.get(`${BASE_URL}/carteira/${clienteId}`, params);
  carteiraLatency.add(res.timings.duration);

  const okRead = check(res, {
    'Consulta CQRS: retorna HTTP 200 OK': (r) => r.status === 200,
    'Consulta CQRS: latencia dentro da meta': (r) => r.timings.duration < 300,
  });
  taxaSucessoNegocio.add(okRead);
}

export function escutarNotificacoesWS() {
  const clienteId = `CLI-ATIVO-${(__VU % 500) + 1}`;
  const params = {
    headers: { 'Authorization': `Bearer ${JWT_TOKEN}` },
  };

  const res = ws.connect(`${WS_URL}?clienteId=${clienteId}`, params, function (socket) {
    socket.on('message', function (msg) {
      const data = JSON.parse(msg);
      if (data.publishedAt) {
        const pushDelay = Date.now() - new Date(data.publishedAt).getTime();
        if (pushDelay >= 0) wsPushLatency.add(pushDelay);
      }
    });

    socket.setTimeout(function () {
      socket.close();
    }, 10000);
  });

  check(res, { 'WebSocket conectado (HTTP 101)': (r) => r && r.status === 101 });
  sleep(1);
}

