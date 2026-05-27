const ComplaintRepository = require("../repositories/ComplaintRepository");
const InventoryRepository = require("../repositories/InventoryRepository");
const StaffRepository = require("../repositories/StaffRepository");
const FinanceRepository = require("../repositories/FinanceRepository");
const withTransaction = require("../utils/transactionHelper");

class ComplaintService {
  async fileComplaint({ title, description, priority, category, flatNumber, residentName, residentPhone, scheduledSlot, residentId, imagePath }) {
    if (!title || !description || !priority) {
      throw new Error("Title, description and priority required");
    }
    if (!imagePath) {
      throw new Error("Photo is required");
    }

    const complain = {
      image_url:     imagePath,
      title,
      category:      category || "General",
      priority,
      description,
      flatNumber,
      residentName,
      residentPhone,
      scheduledSlot,
      resident:      residentId,
    };

    return await ComplaintRepository.create(complain);
  }

  async getComplaints(user) {
    if (!user) throw new Error("Not logged in");
    const filter = user.role === "admin" ? {} : { resident: user.profileId || user.id };
    return await ComplaintRepository.find(filter, [
      { path: "assignedStaff", select: "name department phone" }
    ]);
  }

  async assignMultipleStaffToOneComplaint({ complaintId, staffIds, workType, scheduledAt, scheduledSlot, staffIncentive }) {
    if (!complaintId || !staffIds || !Array.isArray(staffIds) || staffIds.length < 1 || !workType) {
      throw new Error("complaintId, staffIds (array with at least 1) and workType are required");
    }

    return await withTransaction(async (session) => {
      const updated = await ComplaintRepository.updateById(complaintId, {
        assignedStaff: staffIds,
        status: "Assigned",
        workType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        scheduledSlot: scheduledSlot || null,
        staffIncentive: Number(staffIncentive) || 0
      }, session);

      await StaffRepository.updateMany({ _id: { $in: staffIds } }, { isAvailable: false }, session);
      return updated;
    });
  }

  async assignOneStaffToMultipleComplaints({ staffId, complaintIds, workType }) {
    if (!staffId || !Array.isArray(complaintIds) || complaintIds.length === 0) {
      throw new Error("Invalid input data");
    }

    const staff = await StaffRepository.findById(staffId);
    if (!staff) {
      throw new Error("Staff not found");
    }

    return await withTransaction(async (session) => {
      const updateResult = await ComplaintRepository.updateMany(
        { _id: { $in: complaintIds } },
        { $set: { assignedStaff: [staffId], status: "Assigned", workType: workType || "Personal" } },
        session
      );

      await StaffRepository.update(staffId, { isAvailable: false }, session);
      return updateResult;
    });
  }

  async submitEstimate(sessionUser, complaintId, labourEstimate, inventoryEstimate) {
    if (!sessionUser || sessionUser.role !== "staff") {
      throw new Error("Unauthorized");
    }
    if (!complaintId || (!labourEstimate && labourEstimate !== 0)) {
      throw new Error("complaintId and labourEstimate required");
    }

    const complaint = await ComplaintRepository.findById(complaintId);
    if (!complaint) {
      throw new Error("Complaint not found");
    }
    if (!complaint.assignedStaff.includes(sessionUser.profileId)) {
      throw new Error("Not your complaint");
    }

    const isPersonal = complaint.workType === "Personal";
    const invEst = isPersonal ? [] : (inventoryEstimate || []);
    
    // Validate inventory costs
    if (invEst.some(item => isNaN(Number(item.price)) || isNaN(Number(item.qty)))) {
      throw new Error("Inventory estimate prices and quantities must be valid numbers");
    }

    const totalInvCost = invEst.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    const totalEst = Number(labourEstimate) + totalInvCost;

    return await ComplaintRepository.updateById(complaintId, {
      labourEstimate:    Number(labourEstimate),
      inventoryEstimate: invEst,
      estimatedCost:     totalEst,
      estimateStatus:    "Pending",
      status:            "EstimateSubmitted",
    });
  }

  async acceptEstimate(sessionUser, complaintId) {
    if (!sessionUser || sessionUser.role !== "user") {
      throw new Error("Unauthorized");
    }

    const complaint = await ComplaintRepository.findById(complaintId);
    if (!complaint) {
      throw new Error("Complaint not found");
    }
    if (String(complaint.resident) !== String(sessionUser.profileId || sessionUser.id)) {
      throw new Error("Unauthorized access");
    }
    if (complaint.workType !== "Personal") {
      throw new Error("Only personal work estimates can be accepted by residents");
    }
    if (complaint.status !== "EstimateSubmitted") {
      throw new Error("Invalid complaint status for acceptance");
    }

    return await ComplaintRepository.updateById(complaintId, {
      status: "InProgress",
      estimateStatus: "Approved",
    });
  }

  async completeTask(sessionUser, complaintId, worklog, actualLabourCost, actualInventoryUsed, file) {
    if (!sessionUser || sessionUser.role !== "staff") {
      throw new Error("Unauthorized");
    }
    if (!complaintId || !file) {
      throw new Error("complaintId and proof image required");
    }

    const complaint = await ComplaintRepository.findById(complaintId);
    if (!complaint) {
      throw new Error("Complaint not found");
    }
    if (!complaint.assignedStaff.includes(sessionUser.profileId)) {
      throw new Error("Not your complaint");
    }

    let inventory = [];
    try { 
      inventory = typeof actualInventoryUsed === "string" 
        ? JSON.parse(actualInventoryUsed || "[]") 
        : (actualInventoryUsed || []); 
    } catch (_) {}

    const isPersonal = complaint.workType === "Personal";
    
    // Validate costs
    if (inventory.some(item => isNaN(Number(item.price)) || isNaN(Number(item.qty)))) {
      throw new Error("Inventory prices and quantities must be valid numbers");
    }

    const finalLabour = Number(actualLabourCost) || complaint.labourEstimate || 0;
    const finalInvCost = inventory.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    const finalTotal = finalLabour + finalInvCost;

    const updateData = {
      proofImage:    file.path,
      worklog:       worklog || "",
      actualLabourCost: finalLabour,
      actualInventoryUsed: isPersonal ? [] : inventory,
      actualCost:    finalTotal,
      status:        isPersonal ? "PaymentPending" : "Resolved",
    };

    return await withTransaction(async (session) => {
      // 1. Update Complaint status and completion details
      const updatedComplaint = await ComplaintRepository.updateById(complaintId, updateData, session);

      // 2. Update staff status (make available again)
      await StaffRepository.updateMany({ _id: { $in: complaint.assignedStaff } }, { isAvailable: true }, session);

      if (!isPersonal) {
        // 3. Deduct inventory materials (CommonArea only)
        if (inventory.length > 0) {
          await InventoryRepository.deductMaterials(complaintId, session);
        }

        // 4. Record Expense Log in Finance (CommonArea only)
        const now = new Date();
        await FinanceRepository.create({
          transactionType: "Expense",
          transactionCategory: "CommonRepair",
          amount: finalTotal,
          status: "Pending",
          description: `Common Area repair completed: ${complaint.title}`,
          relatedComplaint: complaint._id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          handledBy: sessionUser.profileId
        }, session);
      }

      return updatedComplaint;
    });
  }

  async recordPaymentVerification(sessionUser, complaintId, amount) {
    if (!complaintId || !amount || isNaN(Number(amount))) {
      throw new Error("complaintId and valid amount required");
    }

    return await withTransaction(async (session) => {
      const complaint = await ComplaintRepository.findById(complaintId, session);
      if (!complaint) {
        throw new Error("Complaint not found");
      }
      if (complaint.workType !== "Personal") {
        throw new Error("Only personal work requires payment verification");
      }

      if (sessionUser.role === "user") {
        complaint.userPaymentAmount = Number(amount);
      } else if (sessionUser.role === "staff") {
        complaint.staffPaymentAmount = Number(amount);
      } else {
        throw new Error("Only staff or resident can record payment");
      }

      if (complaint.userPaymentAmount !== null && complaint.staffPaymentAmount !== null) {
        if (complaint.userPaymentAmount === complaint.staffPaymentAmount) {
          complaint.status = "Resolved";
          complaint.isPaymentVerified = true;
          await StaffRepository.updateMany({ _id: { $in: complaint.assignedStaff } }, { isAvailable: true }, session);
        } else {
          const mismatchInfo = {
            staffEntered: complaint.staffPaymentAmount,
            residentEntered: complaint.userPaymentAmount
          };
          complaint.paymentMismatchCount = (complaint.paymentMismatchCount || 0) + 1;
          complaint.lastMismatchStaffAmount = mismatchInfo.staffEntered;
          complaint.lastMismatchUserAmount = mismatchInfo.residentEntered;
          complaint.userPaymentAmount = null;
          complaint.staffPaymentAmount = null;

          await complaint.save({ session });
          return {
            mismatch: true,
            message: `Payment mismatch! Staff entered ₹${mismatchInfo.staffEntered}, Resident entered ₹${mismatchInfo.residentEntered}. Both must re-enter the correct amount.`,
            mismatchInfo
          };
        }
      }

      await complaint.save({ session });
      return {
        mismatch: false,
        message: "Payment recorded successfully",
        isVerified: complaint.isPaymentVerified
      };
    });
  }

  async revokeStaff(sessionUser, complaintId, revokeReason) {
    if (!sessionUser || sessionUser.role !== "user") {
      throw new Error("Unauthorized");
    }
    if (!complaintId) {
      throw new Error("complaintId required");
    }

    return await withTransaction(async (session) => {
      const complaint = await ComplaintRepository.findById(complaintId, session);
      if (!complaint) {
        throw new Error("Complaint not found");
      }
      if (String(complaint.resident) !== String(sessionUser.profileId || sessionUser.id)) {
        throw new Error("Not your complaint");
      }
      if (complaint.workType !== "Personal") {
        throw new Error("Can only revoke Personal work");
      }
      if (!["Assigned", "EstimatePending", "EstimateApproved"].includes(complaint.status)) {
        throw new Error("Cannot revoke at this stage");
      }

      if (complaint.assignedStaff && complaint.assignedStaff.length > 0) {
        await StaffRepository.updateMany({ _id: { $in: complaint.assignedStaff } }, { isAvailable: true }, session);
      }

      return await ComplaintRepository.updateById(complaintId, {
        assignedStaff: [],
        status: "Pending",
        workType: null,
        estimatedCost: null,
        estimateStatus: null,
        revokedAt: new Date(),
        revokeReason: revokeReason || "Revoked by resident",
      }, session);
    });
  }

  async rateStaff(sessionUser, staffId, rating) {
    if (!sessionUser || sessionUser.role !== "user") {
      throw new Error("Unauthorized");
    }
    if (!staffId || !rating) {
      throw new Error("staffId and rating required");
    }
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    return await withTransaction(async (session) => {
      const staff = await StaffRepository.findById(staffId);
      if (!staff) {
        throw new Error("Staff not found");
      }

      const currentTotal = staff.rating * staff.ratingCount;
      const newCount = staff.ratingCount + 1;
      const newRating = (currentTotal + rating) / newCount;

      return await StaffRepository.update(staffId, {
        rating: Math.round(newRating * 10) / 10,
        ratingCount: newCount
      }, session);
    });
  }
}

module.exports = new ComplaintService();
