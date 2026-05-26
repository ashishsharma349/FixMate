const express = require("express");
const router = express.Router();
const paymentService = require("../services/PaymentService");
const { verifyToken, adminOnly } = require("../middleware/jwtMiddleware");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const loggedIn = verifyToken;

// GET /payments/list (admin)
router.get("/list", adminOnly, async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const { maintenance, personal } = await paymentService.listPayments({ month, year });
    res.json({
      maintenance,
      personal,
      filters: {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /payments/my-payments (resident)
router.get("/my-payments", loggedIn, async (req, res, next) => {
  try {
    const { payments, user } = await paymentService.getResidentPayments(req.user.id);
    res.json({ payments, user });
  } catch (err) {
    next(err);
  }
});

// GET /payments/monthly-revenue
router.get("/monthly-revenue", adminOnly, async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const chartData = await paymentService.getMonthlyRevenue({ month, year });
    res.json({
      chartData,
      filters: {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /payments/generate-monthly (admin)
router.post("/generate-monthly", adminOnly, async (req, res, next) => {
  try {
    const result = await paymentService.generateMonthlyBills(req.body.amount);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /payments/create-order (resident)
router.post("/create-order", loggedIn, async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const result = await paymentService.createRazorpayOrder(paymentId, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /payments/verify (loggedIn)
router.post("/verify", loggedIn, async (req, res, next) => {
  try {
    const payment = await paymentService.verifyPayment(req.body, req.user.id);
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

// POST /payments/maintenance (admin)
router.post("/maintenance", adminOnly, async (req, res, next) => {
  try {
    const payment = await paymentService.recordMaintenancePayment(req.body);
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

// POST /payments/mark-paid — admin confirms payment as paid
router.post("/mark-paid", adminOnly, async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const payment = await paymentService.markPaidByAdmin(paymentId);
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

// PUT /payments/:id — admin edits a maintenance payment
router.put("/:id", adminOnly, async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

// DELETE /payments/:id — admin deletes a maintenance payment
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.json({ success: true, message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;