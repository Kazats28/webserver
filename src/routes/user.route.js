import express from "express";
import { body } from "express-validator";
import userController from "../controllers/user.controller.js";
import requestHandler from "../handlers/request.handler.js";
import userModel from "../models/user.model.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

router.post(
  "/signup",
  body("email")
    .exists().withMessage("email is required")
    //.isLength({ min: 8 }).withMessage("username minimum 8 characters")
    .custom(async value => {
      const user = await userModel.findOne({ email: value });
      if (user) return Promise.reject("email already used");
    }),
  body("password")
    .exists().withMessage("password is required")
    .isLength({ min: 8 }).withMessage("password minimum 8 characters"),
  body("confirmPassword")
    .exists().withMessage("confirmPassword is required")
    .isLength({ min: 8 }).withMessage("confirmPassword minimum 8 characters")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("confirmPassword not match");
      return true;
    }),
  body("name")
    .exists().withMessage("name is required")
    .isLength({ min: 4 }).withMessage("name minimum 4 characters"),
  requestHandler.validate,
  userController.signup
);

router.post(
  "/signin",
  body("email")
    .exists().withMessage("email is required"),
    //.isLength({ min: 8 }).withMessage("username minimum 8 characters"),
  body("password")
    .exists().withMessage("password is required")
    .isLength({ min: 8 }).withMessage("password minimum 8 characters"),
  requestHandler.validate,
  userController.signin
);

router.put(
  "/update-password",
  tokenMiddleware.auth,
  body("password")
    .exists().withMessage("password is required")
    .isLength({ min: 8 }).withMessage("password minimum 8 characters"),
  body("newPassword")
    .exists().withMessage("newPassword is required")
    .isLength({ min: 8 }).withMessage("newPassword minimum 8 characters"),
  body("confirmNewPassword")
    .exists().withMessage("confirmNewPassword is required")
    .isLength({ min: 8 }).withMessage("confirmNewPassword minimum 8 characters")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error("confirmNewPassword not match");
      return true;
    }),
  requestHandler.validate,
  userController.updatePassword
);

router.get(
  "/info",
  tokenMiddleware.auth,
  userController.getInfo
);

router.get("/bookings/:id", userController.getBookingsOfUser);
router.get("/favorites/:id", userController.getFavoritesOfUser);
router.get("/ratings/:id", userController.getRatesOfUser);
export default router;