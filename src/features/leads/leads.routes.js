const { Router } = require("express");
const controller = require("./leads.controller");

const router = Router();

router.post("/", controller.criar); // POST /api/v1/leads
router.get("/", controller.listar); // GET  /api/v1/leads

module.exports = router;
