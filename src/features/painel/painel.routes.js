const { Router } = require("express");
const controller = require("./painel.controller");

const router = Router();

// Só os dados (JSON). A tela em si é servida em /painel (ver app.js).
router.get("/", controller.dados);

module.exports = router;
