// const razorpay_config = require("../config/razorpay_config");
// const crypto = require("crypto");

// // The reason for multiplying by 100 is that Razorpay (and most global payment gateways like Stripe) processes transactions in the subunit of the currency, not the main unit.
// // Currency Subunit: For Indian Rupees (INR), the subunit is Paise. Since 100 Paise = 1 Rupee, you must convert your amount.
// razorpay_instance=razorpay_config.createRazorpayInstance();
// exports.createOrder = async (req, res) => {
//     try {
//         const { taskId } = req.body; // Pass the task ID from frontend

//         const options = {
//             amount: 50 * 100, 
//             currency: "INR",
//             receipt: `receipt_task_${taskId}`, 
//             notes: { taskId } // Store taskId in Razorpay notes for tracking
//         };

//         const order = await razorpay_instance.orders.create(options);

//         res.status(200).json({ success: true, order });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


// exports.verifyPayment = async (req, res) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(body.toString())
//         .digest("hex");

//     const isAuthentic = expectedSignature === razorpay_signature;

//     if (isAuthentic) {
//         // Logic to update database 
//         //to do
//         // DATABASE LOGIC BASED ON YOUR DRAWING:
//         // 1. Set Pay_received = True (Admin now has the money)
//         // 2. Set Pay_to_staff = False (Admin hasn't sent it to staff yet)
        
//         // await Task.findByIdAndUpdate(taskId, { 
//         //    payReceived: true, 
//         //    payToStaff: false 
//         // });
//         res.status(200).json({
//             success: true,
//             message: "Payment verified successfully",
//         });
//     } else {
//         res.status(400).json({
//             success: false,
//             message: "Invalid signature, payment verification failed",
//         });
//     }
// };