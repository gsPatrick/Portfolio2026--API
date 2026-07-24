const { Router } = require("express");
const controller = require("./analytics.controller");

const router = Router();

router.get("/summary", controller.summary);
router.get("/sections", controller.sections);
router.get("/clicks", controller.clicks);
router.get("/sessions", controller.sessions);
router.get("/daily", controller.daily);
router.get("/sources", controller.sources);
router.get("/devices", controller.devices);
router.get("/export", controller.exportar);

module.exports = router;
