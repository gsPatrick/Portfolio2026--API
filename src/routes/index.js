const { Router } = require("express");

const healthRoutes = require("../features/health/health.routes");
const trackingRoutes = require("../features/tracking/tracking.routes");
const analyticsRoutes = require("../features/analytics/analytics.routes");
const painelRoutes = require("../features/painel/painel.routes");
const leadsRoutes = require("../features/leads/leads.routes");

const router = Router();

// Versão 1 da API. Tudo é montado sob o prefixo definido em env (ex.: /api).
router.use("/v1", healthRoutes); // GET  /api/v1/ping
router.use("/v1", trackingRoutes); // POST /api/v1/events
router.use("/v1/analytics", analyticsRoutes); // GET  /api/v1/analytics/*
router.use("/v1/painel", painelRoutes); // GET  /api/v1/painel (dados do painel)
router.use("/v1/leads", leadsRoutes); // POST/GET /api/v1/leads (mensagens do formulário)

module.exports = router;
