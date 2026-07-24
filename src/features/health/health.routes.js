const { Router } = require("express");
const controller = require("./health.controller");

const router = Router();

router.get("/ping", controller.ping);

module.exports = router;
