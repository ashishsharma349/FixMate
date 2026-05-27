const Inventory = require("../model/Inventory");
const Complain = require("../model/Complain");

class InventoryRepository {
  async find(filter = {}, sortOpts = { name: 1 }) {
    return await Inventory.find(filter).sort(sortOpts);
  }

  async findOne(filter, session = null) {
    const query = Inventory.findOne(filter);
    if (session) {
      query.session(session);
    }
    return await query;
  }

  async findById(id) {
    return await Inventory.findById(id);
  }

  async create(data) {
    return await Inventory.create(data);
  }

  async updateById(id, updatePayload) {
    return await Inventory.findByIdAndUpdate(id, { $set: updatePayload }, { new: true });
  }

  async deleteById(id) {
    return await Inventory.findByIdAndDelete(id);
  }

  async bulkWrite(ops, options = {}) {
    return await Inventory.bulkWrite(ops, options);
  }

  async deductMaterials(complaintId, session) {
    // Fetch complaint within transaction session
    const complaint = await Complain.findById(complaintId).session(session);
    if (!complaint) return;
    
    const materialsUsed = complaint.actualInventoryUsed || [];
    if (materialsUsed.length === 0) return;

    const ops = materialsUsed.map(mat => ({
      updateOne: {
        filter: { name: mat.name },
        update: { 
          $inc: { quantity: -Math.abs(Number(mat.qty)) },
          $set: { updatedAt: new Date() }
        }
      }
    }));

    await Inventory.bulkWrite(ops, { session });
  }
}

module.exports = new InventoryRepository();
