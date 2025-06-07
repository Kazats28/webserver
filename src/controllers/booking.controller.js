import mongoose from "mongoose";
import Bookings from "../models/booking.model.js";
import Movie from "../models/movie.model.js";
import User from "../models/user.model.js";

import moment from "moment";
import querystring from "qs";
import crypto from "crypto";
import fetch from "node-fetch";
import { verifyMessage } from "ethers";
import PayOS from "@payos/node";
import paypal from "@paypal/checkout-server-sdk";

const frontEndUrl = process.env.FRONTEND_URL;

// PayOS
const payOS = new PayOS(
  'e7a80dce-27ee-413f-bbbf-679f37db938c',
  '50dfc744-c1c1-4161-8903-ec23bdb7afbd',
  'b215539a6a14dc009aa0f218b7f369f72f7492bab4ea0dd12c61c0e68326e5c2'
);

// PayPal
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// === Booking Logic ===

export const newBooking = async (req, res) => {
  const { movie, date, hour, seatNumber, user } = req.body;

  try {
    const existingMovie = await Movie.findById(movie);
    const existingUser = await User.findById(user);

    if (!existingMovie) {
      return res.status(404).json({ message: "Movie Not Found With Given ID" });
    }
    if (!existingUser) {
      return res.status(404).json({ message: "User not found with given ID" });
    }

    const booking = new Bookings({
      movie,
      date: new Date(date),
      hour,
      seatNumber,
      user,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    existingUser.bookings.push(booking);
    existingMovie.bookings.push(booking);

    await existingUser.save({ session });
    await existingMovie.save({ session });
    await booking.save({ session });

    await session.commitTransaction();

    return res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to create a booking" });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Bookings.find({ movie: id });
    return res.status(200).json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unexpected Error" });
  }
};

export const deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Bookings.findByIdAndRemove(id).populate("user movie");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const session = await mongoose.startSession();
    session.startTransaction();

    await booking.user.bookings.pull(booking);
    await booking.movie.bookings.pull(booking);
    await booking.user.save({ session });
    await booking.movie.save({ session });

    await session.commitTransaction();

    return res.status(200).json({ message: "Successfully Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to delete booking" });
  }
};

// === Payment Logic ===

export const createPayOSPayment = async (req, res) => {
  const { id, amount } = req.body;
  const createDateInt = parseInt(moment().format('HHmmss'), 10) + Math.floor(Math.random() * 100000);

  const order = {
    amount,
    description: '-MyShowz',
    orderCode: createDateInt,
    returnUrl: `${frontEndUrl}/movie/${id}`,
    cancelUrl: `${frontEndUrl}/movie/${id}`
  };

  const paymentUrl = await payOS.createPaymentLink(order);
  res.json({ code: '00', data: paymentUrl.checkoutUrl });
};

export const createPayPalPayment = async (req, res) => {
  const { id, amount } = req.body;

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/VND');
    const data = await response.json();
    const rate = data?.rates?.USD;

    if (!rate) {
      return res.status(500).json({ code: '99', message: 'Không lấy được tỷ giá USD' });
    }

    const usdAmount = (amount * rate).toFixed(2);
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: usdAmount
        },
        description: `Thanh toán vé phim -MyShowz (${amount} VND ~ ${usdAmount} USD)`
      }],
      application_context: {
        return_url: `${frontEndUrl}/movie/${id}?paypal=success`,
        cancel_url: `${frontEndUrl}/movie/${id}?paypal=cancel`
      }
    });

    const order = await client.execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === "approve").href;
    res.json({ code: '00', data: approvalUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code: '99', message: 'Lỗi khi tạo đơn hàng PayPal' });
  }
};

export const createVNPayPayment = async (req, res) => {
  const { id, amount } = req.body;
  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  const orderId = moment(date).format('DDHHmmss');
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  
  let vnp_Params = {
    'vnp_Version': '2.1.0',
    'vnp_Command': 'pay',
    'vnp_TmnCode': 'DDPRNYWB',
    'vnp_Locale': 'vn',
    'vnp_CurrCode': 'VND',
    'vnp_TxnRef': orderId,
    'vnp_OrderInfo': `Thanh toan cho ma GD:${orderId}`,
    'vnp_OrderType': 'other',
    'vnp_Amount': amount * 100,
    'vnp_ReturnUrl': `${frontEndUrl}/movie/${id}`,
    'vnp_IpAddr': ipAddr,
    'vnp_CreateDate': createDate,
    'vnp_BankCode': 'VNPAY',
  };

  vnp_Params = sortObject(vnp_Params);
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", "6N58MPMUZYSJKM98TVV28UG6QDJ9A9AB");
  const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;

  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?" + querystring.stringify(vnp_Params, { encode: false });
  res.json({ code: '00', data: vnpUrl });
};

export const verifyFreeSignature = async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    const recovered = verifyMessage(message, signature);

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ code: '01', message: 'Chữ ký không hợp lệ' });
    }

    return res.status(200).json({ code: '00', message: 'Xác minh thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ code: '99', message: 'Lỗi hệ thống' });
  }
};

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
