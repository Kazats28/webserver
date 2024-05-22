import express from "express";
import bookingController from "../controllers/booking.controller.js";
import crypto from "crypto";
import querystring from "qs";
import moment from "moment";
import PayOS from "@payos/node";

const payOS = new PayOS('e7a80dce-27ee-413f-bbbf-679f37db938c', 
'50dfc744-c1c1-4161-8903-ec23bdb7afbd', 
'b215539a6a14dc009aa0f218b7f369f72f7492bab4ea0dd12c61c0e68326e5c2');
const frontEndUrl = "https://test-deploy-client-weld.vercel.app";
const router = express.Router({});

router.get("/:id", bookingController.getBookingById);
router.post("/", bookingController.newBooking);
router.delete("/:id", bookingController.deleteBooking);

router.post('/create_payment', async (req, res) => {
    const id = req.body.id;
    const price = req.body.amount;
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    const order = {
        amount: price,
        description: '-MyShowz',
        orderCode: createDate,
        returnUrl: `${frontEndUrl}/movie/${id}`,
        cancelUrl: `${frontEndUrl}/movie/${id}`
    };
    const paymentUrl = await payOS.createPaymentLink(order);
    res.json({ code: '00', data: paymentUrl.checkoutUrl });
});

router.post('/create_payment_url', async (req, res) => {
    let id = req.body.id;
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    
    let tmnCode = "DDPRNYWB";
    let secretKey = "151X15XI483XK6964TXO01Z3GXFLSB3J";
    let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    let returnUrl = `${frontEndUrl}/movie/${id}`;
    let orderId = moment(date).format('YYYYMMDDHHmmss');
    let amount = req.body.amount;
    let bankCode = "VNPAY";
    
    let currCode = 'VND';
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if(bankCode !== null && bankCode !== ''){
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });  
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
    res.json({ code: '00', data: vnpUrl });
});

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

export default router;