import express from "express";
import adminController from "../controllers/admin.controller.js";

const router = express.Router({});


router.post("/signup", adminController.addAdmin);
router.post("/login", adminController.adminLogin);
router.get("/", adminController.getAdmins);
router.get("/:id", adminController.getAdminById);
export default router;