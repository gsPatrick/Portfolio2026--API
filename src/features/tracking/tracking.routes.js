const { Router } = require("express");
const controller = require("./tracking.controller");

const router = Router();

// Ingestão de eventos (o front usa sendBeacon/fetch para POSTar aqui).
router.post("/events", controller.ingest);

module.exports = router;
