const mongoose = require("mongoose");

/**
 * Helper to run Mongoose operations inside a transaction.
 * @param {function(mongoose.ClientSession): Promise<any>} workFn - The operations to run in the transaction.
 * @returns {Promise<any>} The result of workFn.
 */
async function withTransaction(workFn) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = withTransaction;
