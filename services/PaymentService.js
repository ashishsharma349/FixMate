const Razorpay = require("razorpay");
const crypto = require("crypto");
const paymentRepository = require("../repositories/PaymentRepository");
const userRepository = require("../repositories/UserRepository");
const authRepository = require("../repositories/AuthRepository");
const mailer = require("../utils/mailer");
const User = require("../model/User");
const Auth = require("../model/Auth");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentService {
  async listPayments(filters) {
    const { month, year } = filters;
    let personalMatch = { type: "personal" };
    if (month && month !== "") {
      personalMatch.month = parseInt(month);
    }
    if (year && year !== "") {
      personalMatch.year = parseInt(year);
    }

    let maintenanceMatch = { type: "maintenance" };
    if ((month && month !== "") || (year && year !== "")) {
      const currentYear = new Date().getFullYear();
      let filterYear = (year && year !== "") ? parseInt(year) : currentYear;
      let filterMonth = (month && month !== "") ? parseInt(month) : null;

      let startDate;
      let endDate;
      if (filterMonth !== null) {
        startDate = new Date(filterYear, filterMonth - 1, 1);
        endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59);
      } else {
        startDate = new Date(filterYear, 0, 1);
        endDate = new Date(filterYear, 11, 31, 23, 59, 59);
      }

      maintenanceMatch.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const [maintenance, personal] = await Promise.all([
      paymentRepository.findByFilter(
        maintenanceMatch,
        [
          { path: "worker", select: "name department" },
          {
            path: "complaint",
            populate: [
              { path: "resident", select: "name flatNumber phone" },
              { path: "assignedStaff", select: "name phone" }
            ]
          }
        ],
        { createdAt: -1 }
      ),
      paymentRepository.findByFilter(
        personalMatch,
        [{ path: "resident", select: "name flatNumber phone" }],
        { createdAt: -1 }
      )
    ]);

    return { maintenance, personal };
  }

  async getResidentPayments(userId) {
    const user = await User.findOne({ authId: userId });
    if (!user) {
      const error = new Error("User profile not found");
      error.statusCode = 404;
      throw error;
    }

    const payments = await paymentRepository.findByFilter(
      { type: "personal", resident: user._id },
      [],
      { createdAt: -1 }
    );

    return { payments, user };
  }

  async getMonthlyRevenue(filters) {
    const { month, year } = filters;
    let matchCondition = { type: "personal", status: "Paid" };
    if (month && year) {
      matchCondition.month = parseInt(month);
      matchCondition.year = parseInt(year);
    }

    const data = await paymentRepository.aggregateRevenue(matchCondition);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = data.map((d) => ({
      month: `${months[d._id.month - 1]} ${String(d._id.year).slice(-2)}`,
      monthNum: d._id.month,
      year: d._id.year,
      revenue: d.revenue,
      count: d.count,
    }));

    return chartData;
  }

  async generateMonthlyBills(amountInput) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const amount = amountInput || 5000;

    const residents = await User.find({});
    const existingPayments = await paymentRepository.findExistingPaymentsForPeriod(month, year);
    const existingResidentIds = new Set(existingPayments.map(p => p.resident.toString()));

    const residentsToBill = residents.filter(r => !existingResidentIds.has(r._id.toString()));

    if (residentsToBill.length === 0) {
      return { success: true, created: 0, skipped: residents.length, month, year };
    }

    let lastNum = await paymentRepository.getLastRefIdNumber("personal");
    const paymentDocs = [];

    for (const resident of residentsToBill) {
      lastNum++;
      const refId = `PER-${String(lastNum).padStart(5, "0")}`;
      paymentDocs.push({
        type: "personal",
        resident: resident._id,
        flatNumber: resident.flatNumber || "—",
        amount,
        dueDate: new Date(year, month, 5),
        status: "Pending",
        month,
        year,
        refId,
      });
    }

    await paymentRepository.createMany(paymentDocs);

    return {
      success: true,
      created: paymentDocs.length,
      skipped: existingResidentIds.size,
      month,
      year
    };
  }

  async createRazorpayOrder(paymentId, userId) {
    if (!paymentId) {
      const error = new Error("paymentId required");
      error.statusCode = 400;
      throw error;
    }

    const payment = await paymentRepository.findByIdAndPopulate(paymentId, [{ path: "resident", select: "name flatNumber authId" }]);
    if (!payment) {
      const error = new Error("Payment record not found");
      error.statusCode = 404;
      throw error;
    }

    if (payment.status === "Paid") {
      const error = new Error("Already paid");
      error.statusCode = 400;
      throw error;
    }

    // Authorization & Ownership Check
    const user = await User.findOne({ authId: userId });
    if (!user) {
      const error = new Error("User profile not found");
      error.statusCode = 404;
      throw error;
    }

    const residentId = payment.resident._id || payment.resident;
    const authUser = await Auth.findById(userId);
    if (!authUser || (authUser.role !== "admin" && residentId.toString() !== user._id.toString())) {
      const error = new Error("Access denied. This payment does not belong to you.");
      error.statusCode = 403;
      throw error;
    }

    if (payment.razorpayOrderId) {
      return {
        orderId: payment.razorpayOrderId,
        amount: payment.amount * 100,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        residentName: payment.resident?.name || "",
        flatNumber: payment.flatNumber,
      };
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(payment.amount) * 100),
      currency: "INR",
      receipt: `fixmate_${payment._id}`.substring(0, 40),
      notes: {
        flatNumber: String(payment.flatNumber || "N/A"),
        residentName: String(payment.resident?.name || "N/A"),
        paymentId: String(payment._id),
      },
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      residentName: payment.resident?.name || "",
      flatNumber: payment.flatNumber,
    };
  }

  async verifyPayment(verificationData, userId) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const error = new Error("Missing required payment verification fields");
      error.statusCode = 400;
      throw error;
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      const error = new Error("Invalid payment signature");
      error.statusCode = 400;
      throw error;
    }

    const payments = await paymentRepository.findByFilter({ razorpayOrderId: razorpay_order_id }, ["resident"]);
    if (payments.length === 0) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }
    const payment = payments[0];

    // Authorization & Ownership Check
    const user = await User.findOne({ authId: userId });
    if (!user) {
      const error = new Error("User profile not found");
      error.statusCode = 404;
      throw error;
    }

    const residentId = payment.resident._id || payment.resident;
    const authUser = await Auth.findById(userId);
    if (!authUser || (authUser.role !== "admin" && residentId.toString() !== user._id.toString())) {
      const error = new Error("Access denied. This payment does not belong to you.");
      error.statusCode = 403;
      throw error;
    }

    payment.status = "Paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    await payment.save();

    if (payment.type === "personal" && payment.resident) {
      await this._sendReceipt(payment, razorpay_payment_id);
    }

    return payment;
  }

  async recordMaintenancePayment(data) {
    const { complaintId, workerId, workerName, purpose, amount } = data;
    if (!amount || !purpose) {
      const error = new Error("amount and purpose required");
      error.statusCode = 400;
      throw error;
    }

    const refId = await paymentRepository.generateRefId("maintenance");
    const payment = await paymentRepository.createPayment({
      type: "maintenance",
      complaint: complaintId || null,
      worker: workerId || null,
      workerName,
      purpose,
      amount,
      status: "Paid",
      paidAt: new Date(),
      refId,
    });

    return payment;
  }

  async markPaidByAdmin(paymentId) {
    if (!paymentId) {
      const error = new Error("paymentId required");
      error.statusCode = 400;
      throw error;
    }

    const payment = await paymentRepository.updateById(
      paymentId,
      { status: "Paid", paidAt: new Date(), razorpayPaymentId: "ADMIN_CONFIRMED" }
    );

    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    const populated = await paymentRepository.findByIdAndPopulate(payment._id, [{ path: "resident", select: "name flatNumber authId" }]);

    if (populated.type === "personal" && populated.resident) {
      await this._sendReceipt(populated, "ADMIN_CONFIRMED");
    }

    return populated;
  }

  async updatePayment(id, data) {
    const { purpose, amount, workerName, status, paidAt } = data;
    const update = {};
    if (purpose !== undefined) update.purpose = purpose;
    if (amount !== undefined) update.amount = Number(amount);
    if (workerName !== undefined) update.workerName = workerName;
    if (status !== undefined) update.status = status;
    if (paidAt !== undefined) update.paidAt = paidAt ? new Date(paidAt) : null;

    const payment = await paymentRepository.updateById(id, update);
    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    if (payment.type === "maintenance" && payment.complaint && amount !== undefined) {
      const Complain = require("../model/Complain");
      await Complain.findByIdAndUpdate(payment.complaint, { 
        $set: { actualCost: Number(amount) } 
      });
    }

    return payment;
  }

  async deletePayment(id) {
    const payment = await paymentRepository.deleteById(id);
    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }
    return payment;
  }

  async _sendReceipt(payment, razorpayPaymentId) {
    try {
      let auth;
      if (payment.resident.authId) {
        auth = await Auth.findById(payment.resident.authId);
      } else {
        auth = await Auth.findOne({ _id: payment.resident._id });
      }

      if (auth && auth.email) {
        await mailer.sendPaymentReceipt(auth.email, {
          residentName: payment.resident.name,
          flatNumber: payment.resident.flatNumber,
          amount: payment.amount,
          refId: payment.refId,
          paidAt: payment.paidAt,
          razorpayPaymentId,
        });
        console.log(`[Payment Receipt] Email sent to ${auth.email} for payment ${payment.refId}`);
      } else {
        console.log("[Payment Receipt] No email found for resident:", payment.resident._id);
      }
    } catch (emailErr) {
      console.error("[Payment Receipt Email Error]:", emailErr.message);
    }
  }
}

module.exports = new PaymentService();
