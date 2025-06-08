import userModel from "../models/user.model.js";
import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import Bookings from "../models/booking.model.js";
import Favorites from "../models/favorite.model.js";
import Rate from "../models/rate.model.js";
import { OAuth2Client } from "google-auth-library";
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const checkUser = await userModel.findOne({ email });
    
    if (checkUser) return responseHandler.badrequest(res, "Email đã được đăng ký.");
    
    const user = new userModel();
    
    user.name = name;
    user.email = email;
    user.setPassword(password);
    await user.save();
    const token = jsonwebtoken.sign(
      { data: user.id },
      process.env.TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    responseHandler.created(res, {
      token,
      ...user._doc,
      id: user.id
    });
  } catch(err) {
    responseHandler.error(res);
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("email password salt id name");

    if (!user) return responseHandler.badrequest(res, "Tài khoản không tồn tại. Hãy đăng ký tài khoản.");

    if (!user.validPassword(password)) return responseHandler.badrequest(res, "Sai mật khẩu.");

    const token = jsonwebtoken.sign(
      { data: user.id },
      process.env.TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    user.password = undefined;
    user.salt = undefined;

    responseHandler.created(res, {
      token,
      ...user._doc,
      id: user.id
    });
  } catch {
    responseHandler.error(res);
  }
};

const updatePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;
    const user = await userModel.findById(req.user.id).select("password id salt");

    if (!user) return responseHandler.unauthorize(res);

    // Nếu user chưa từng đặt mật khẩu (đăng nhập Google), cho phép đặt luôn
    if (!user.password) {
      user.setPassword(newPassword);
      await user.save();
      return responseHandler.ok(res, { message: "Đặt mật khẩu thành công!" });
    }

    // Nếu đã có mật khẩu, kiểm tra mật khẩu cũ
    if (!user.validPassword(password)) return responseHandler.badrequest(res, "Sai mật khẩu.");

    user.setPassword(newPassword);
    await user.save();

    responseHandler.ok(res, { message: "Đổi mật khẩu thành công!" });
  } catch {
    responseHandler.error(res);
  }
};

const getBookingsOfUser = async (req, res, next) => {
  const id = req.params.id;
  let bookings;
  try {
    bookings = await Bookings.find({ user: id })
      .populate("movie")
      .populate("user");
  } catch (err) {
    return console.log(err);
  }
  if (!bookings) {
    return res.status(500).json({ message: "Unable to get Bookings" });
  }
  return res.status(200).json({ bookings });
};
const getFavoritesOfUser = async (req, res, next) => {
  const id = req.params.id;
  let favorites;
  try {
    favorites = await Favorites.find({ user: id })
      .populate("movie")
      .populate("user");
  } catch (err) {
    return console.log(err);
  }
  if (!favorites) {
    return res.status(500).json({ message: "Unable to get Favorites" });
  }
  return res.status(200).json({ favorites });
};
const getRatesOfUser = async (req, res, next) => {
  const id = req.params.id;
  let rates;
  try {
    rates = await Rate.find({ user: id })
      .populate("movie")
      .populate("user");
  } catch (err) {
    return console.log(err);
  }
  if (!rates) {
    return res.status(500).json({ message: "Unable to get Rates" });
  }
  return res.status(200).json({ rates });
};
const getInfo = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("+password");
    console.log(user);
    if (!user) return responseHandler.notfound(res);

    responseHandler.ok(res, user);
  } catch {
    responseHandler.error(res);
  }
};
const client = new OAuth2Client("924480311257-fg4vh5gmi206es2140hednb2mctmedig.apps.googleusercontent.com"); // Thay bằng Google Client ID của bạn

const googleSignin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return responseHandler.badrequest(res, "Thiếu credential từ Google.");

    // Xác thực token Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: "924480311257-fg4vh5gmi206es2140hednb2mctmedig.apps.googleusercontent.com", // Thay bằng Google Client ID của bạn
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Tìm hoặc tạo user
    let user = await userModel.findOne({ email });
    if (!user) {
      user = new userModel({
        email,
        name: name || email
      });
      await user.save();
    }

    const token = jsonwebtoken.sign(
      { data: user.id },
      process.env.TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    responseHandler.created(res, {
      token,
      ...user._doc,
      id: user.id
    });
  } catch (err) {
    responseHandler.badrequest(res, "Xác thực Google thất bại!");
  }
};

export default {
  signup,
  signin,
  getInfo,
  updatePassword,
  getBookingsOfUser,
  getFavoritesOfUser,
  getRatesOfUser,
  googleSignin
};