import express from "express";
import rateController from "../controllers/rate.controller.js";

const router = express.Router({});

router.post("/", rateController.addRate);
router.put("/update", rateController.updateRate);
export default router;