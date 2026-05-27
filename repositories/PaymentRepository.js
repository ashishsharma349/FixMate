const Payment = require("../model/Payment");

class PaymentRepository {
  async findById(id) {
    return await Payment.findById(id);
  }

  async findByIdAndPopulate(id, populateOpts) {
    let query = Payment.findById(id);
    if (populateOpts) {
      query = query.populate(populateOpts);
    }
    return await query;
  }

  async findByFilter(filter, populateOpts = [], sortOpts = { createdAt: -1 }) {
    let query = Payment.find(filter).sort(sortOpts);
    for (const opt of populateOpts) {
      query = query.populate(opt);
    }
    return await query;
  }

  async findByResidentAndPeriod(residentId, month, year) {
    return await Payment.findOne({
      type: "personal",
      resident: residentId,
      month,
      year,
    });
  }

  async findExistingPaymentsForPeriod(month, year) {
    return await Payment.find({
      type: "personal",
      month,
      year
    }).select("resident");
  }

  async createPayment(data) {
    return await Payment.create(data);
  }

  async createMany(paymentDocs) {
    return await Payment.insertMany(paymentDocs);
  }

  async updateById(id, updateData) {
    return await Payment.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async updateByOrderId(orderId, updateData, populateOpts = []) {
    let query = Payment.findOneAndUpdate(
      { razorpayOrderId: orderId },
      { $set: updateData },
      { new: true }
    );
    for (const opt of populateOpts) {
      query = query.populate(opt);
    }
    return await query;
  }

  async deleteById(id) {
    return await Payment.findByIdAndDelete(id);
  }

  async aggregateRevenue(matchCondition) {
    return await Payment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);
  }

  async generateRefId(type) {
    const prefix = type === "personal" ? "PER" : "MAN";
    const lastRecord = await Payment.findOne({ type, refId: { $regex: new RegExp(`^${prefix}-`) } })
      .sort({ refId: -1 })
      .exec();

    let nextNum = 1;
    if (lastRecord && lastRecord.refId) {
      const lastNum = parseInt(lastRecord.refId.split("-")[1]);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    return `${prefix}-${String(nextNum).padStart(5, "0")}`;
  }
  async getLastRefIdNumber(type) {
    const prefix = type === "personal" ? "PER" : "MAN";
    const lastRecord = await Payment.findOne({ type, refId: { $regex: new RegExp(`^${prefix}-`) } })
      .sort({ refId: -1 })
      .exec();

    if (lastRecord && lastRecord.refId) {
      const lastNum = parseInt(lastRecord.refId.split("-")[1]);
      if (!isNaN(lastNum)) {
        return lastNum;
      }
    }
    return 0;
  }
}

module.exports = new PaymentRepository();
