import express from "express";
import favoriteController from "../controllers/favorite.controller.js";

const router = express.Router({});

router.get("/:id", favoriteController.getFavoriteById);
router.post("/", favoriteController.addFavorite);
router.delete("/:id", favoriteController.deleteFavorite);

export default router;