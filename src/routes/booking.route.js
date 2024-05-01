import express from "express";
import bookingController from "../controllers/booking.controller.js";

const router = express.Router({});

router.get("/:id", bookingController.getBookingById);
router.post("/", bookingController.newBooking);
router.delete("/:id", bookingController.deleteBooking);

export default router;