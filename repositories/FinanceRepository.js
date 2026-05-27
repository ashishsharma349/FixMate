const Finance = require("../model/finance");

class FinanceRepository {
  async create(data, session = null) {
    if (session) {
      const created = await Finance.create([data], { session });
      return created[0];
    }
    return await Finance.create(data);
  }

  async findById(id) {
    return await Finance.findById(id);
  }

  async findByFilter(filter, populateOpts = [], sortOpts = { date: -1 }) {
    let query = Finance.find(filter).sort(sortOpts);
    for (const opt of populateOpts) {
      query = query.populate(opt);
    }
    return await query;
  }

  async updateById(id, updateData) {
    return await Finance.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async deleteById(id) {
    return await Finance.findByIdAndDelete(id);
  }

  async aggregate(pipeline) {
    return await Finance.aggregate(pipeline);
  }
}

module.exports = new FinanceRepository();
