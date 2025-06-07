import express from "express";
import * as bookingController from "../controllers/booking.controller.js";

const router = express.Router();

router.get("/:id", bookingController.getBookingById);
router.post("/", bookingController.newBooking);
router.delete("/:id", bookingController.deleteBooking);

// Payment routes
router.post("/create_payment", bookingController.createPayOSPayment);
router.post("/create_paypal_payment", bookingController.createPayPalPayment);
router.post("/create_payment_url", bookingController.createVNPayPayment);
router.post("/verify_free_signature", bookingController.verifyFreeSignature);

export default router;
