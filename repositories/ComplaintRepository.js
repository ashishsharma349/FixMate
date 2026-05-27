const Complain = require("../model/Complain");

class ComplaintRepository {
  async findById(id, session = null) {
    const query = Complain.findById(id);
    if (session) {
      query.session(session);
    }
    return await query;
  }

  async findByIdAndPopulate(id, populateOpts = [], session = null) {
    let query = Complain.findById(id);
    if (session) {
      query.session(session);
    }
    for (const opt of populateOpts) {
      query = query.populate(opt);
    }
    return await query;
  }

  async find(filter, populateOpts = [], sortOpts = { createdAt: -1 }) {
    let query = Complain.find(filter).sort(sortOpts);
    for (const opt of populateOpts) {
      query = query.populate(opt);
    }
    return await query;
  }

  async create(data, session = null) {
    if (session) {
      const created = await Complain.create([data], { session });
      return created[0];
    }
    return await Complain.create(data);
  }

  async updateById(id, updateData, session = null) {
    const options = { new: true };
    if (session) {
      options.session = session;
    }
    return await Complain.findByIdAndUpdate(id, { $set: updateData }, options);
  }

  async updateMany(filter, updateData, session = null) {
    const options = {};
    if (session) {
      options.session = session;
    }
    return await Complain.updateMany(filter, updateData, options);
  }

  async countDocuments(filter = {}) {
    return await Complain.countDocuments(filter);
  }

  async aggregate(pipeline) {
    return await Complain.aggregate(pipeline);
  }
}

module.exports = new ComplaintRepository();
