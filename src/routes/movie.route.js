import express from "express";
import movieController from "../controllers/movie-controller.js";

const router = express.Router({});

router.get("/", movieController.getAllMovies);
router.get("/:id", movieController.getMovieById);
router.post("/", movieController.addMovie);
router.put("/update", movieController.updateMovieById);
router.delete("/:id", movieController.deleteMovie);
router.put("/update/:id", movieController.updateAverageRating);
export default router;