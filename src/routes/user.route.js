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
    .exists().withMessage("Hãy nhập email.")
    //.isLength({ min: 8 }).withMessage("username minimum 8 characters")
    .custom(async value => {
      const user = await userModel.findOne({ email: value });
      if (user) return Promise.reject("Email đã được đăng ký.");
    }),
  body("password")
    .exists().withMessage("Hãy nhập mật khẩu.")
    .isLength({ min: 8 }).withMessage("Mật khẩu phải có ít nhất 8 kí tự."),
  body("confirmPassword")
    .exists().withMessage("Hãy nhập mật khẩu xác nhận.")
    .isLength({ min: 8 }).withMessage("Mật khẩu xác nhận phải có ít nhất 8 kí tự.")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Mật khẩu xác nhận không khớp.");
      return true;
    }),
  body("name")
    .exists().withMessage("Hãy nhập tên người dùng.")
    .isLength({ min: 4 }).withMessage("Tên người dùng phải có ít nhất 4 kí tự."),
  requestHandler.validate,
  userController.signup
);

router.post(
  "/signin",
  body("email")
    .exists().withMessage("Hãy nhập email."),
    //.isLength({ min: 8 }).withMessage("username minimum 8 characters"),
  body("password")
    .exists().withMessage("Hãy nhập mật khẩu.")
    .isLength({ min: 8 }).withMessage("Mật khẩu phải có ít nhất 8 kí tự."),
  requestHandler.validate,
  userController.signin
);

router.put(
  "/update-password",
  tokenMiddleware.auth,
  body("newPassword")
    .exists().withMessage("Hãy nhập mật khẩu mới.")
    .isLength({ min: 8 }).withMessage("Mật khẩu mới phải có ít nhất 8 kí tự."),
  body("confirmNewPassword")
    .exists().withMessage("Hãy nhập mật khẩu xác nhận mới.")
    .isLength({ min: 8 }).withMessage("Mật khẩu xác nhận mới phải có ít nhất 8 kí tự.")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error("Mật khẩu xác nhận mới không khớp.");
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
router.post("/google-login", userController.googleSignin);
router.put('/update-wallet/:id', async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    user.wallet = (user.wallet || 0) + (req.body.amount || 0);
    await user.save();
    res.json({ success: true, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: "Cập nhật tiền thất bại" });
  }
});

export default router;