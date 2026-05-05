// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.MAIL_USER,       // your gmail e.g. fixmate.app@gmail.com
//     pass: process.env.MAIL_PASS        // gmail app password (not your actual gmail password)
//   }
// });

// /**
//  * Sends a welcome email with temp password to newly created user/staff
//  * @param {string} toEmail - recipient email
//  * @param {string} name - recipient name
//  * @param {string} tempPassword - auto-generated temp password
//  * @param {string} role - "user" or "staff"
//  */
// exports.sendTempPasswordMail = async (toEmail, name, tempPassword, role) => {
//   const mailOptions = {
//     from: `"FixMate Admin" <${process.env.MAIL_USER}>`,
//     to: toEmail,
//     subject: "Welcome to FixMate – Your Account Details",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
//         <h2 style="color: #4f46e5;">Welcome to FixMate, ${name}!</h2>
//         <p>Your account has been created by the Admin as a <strong>${role}</strong>.</p>
//         <p>Use the credentials below to log in for the first time:</p>
//         <div style="background: #f4f4f4; padding: 15px; border-radius: 6px; margin: 15px 0;">
//           <p><strong>Email:</strong> ${toEmail}</p>
//           <p><strong>Temporary Password:</strong> <span style="color: #e11d48; font-size: 18px; letter-spacing: 1px;">${tempPassword}</span></p>
//         </div>
//         <p style="color: #f59e0b;"><strong>⚠ You will be asked to change your password on first login.</strong></p>
//         <p style="color: #888; font-size: 12px;">If you did not expect this email, please contact your building admin.</p>
//       </div>
//     `
//   };

//   await transporter.sendMail(mailOptions);
// };

require("dotenv").config(); // CRITICAL: This loads your .env file
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/**
 * Sends a welcome email with temp password to newly created user/staff
 */
exports.sendTempPasswordMail = async (toEmail, name, tempPassword, role) => {
  try {
    const mailOptions = {
      from: `"FixMate Admin" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to FixMate Your Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Welcome to FixMate, ${name}!</h2>
          <p>Your account has been created by the Admin as a <strong>${role}</strong>.</p>
          <p>Use the credentials below to log in for the first time:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Email:</strong> ${toEmail}</p>
            <p><strong>Temporary Password:</strong> <span style="color: #e11d48; font-size: 18px; letter-spacing: 1px;">${tempPassword}</span></p>
          </div>
          <p style="color: #f59e0b;"><strong>⚠ You will be asked to change your password on first login.</strong></p>
          <p style="color: #888; font-size: 12px;">If you did not expect this email, please contact your building admin.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Mail Sent]: " + info.response);
  } catch (error) {
    console.error("[Mailer Error]: ", error);
    throw error; // Throw so the controller knows it failed
  }
};

/**
 * Sends payment receipt email to residents after successful online payment
 * @param {string} toEmail - recipient email
 * @param {Object} paymentDetails - payment information
 */
exports.sendPaymentReceipt = async (toEmail, paymentDetails) => {
  try {
    const { residentName, flatNumber, amount, refId, paidAt, razorpayPaymentId } = paymentDetails;

    const mailOptions = {
      from: `"FixMate Admin" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: "Payment Receipt - FixMate Maintenance Fee",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5; margin: 0;">FixMate</h1>
            <p style="color: #666; margin: 5px 0;">Society Management System</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Payment Receipt</h2>
            <p style="color: #64748b; margin-bottom: 20px;">Thank you for your payment! Your transaction has been successfully processed.</p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Receipt ID:</span>
                <strong style="color: #1e293b;">${refId}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Resident Name:</span>
                <strong style="color: #1e293b;">${residentName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Flat Number:</span>
                <strong style="color: #1e293b;">${flatNumber}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Payment Amount:</span>
                <strong style="color: #16a34a; font-size: 18px;">₹${amount.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Payment Date:</span>
                <strong style="color: #1e293b;">${new Date(paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Transaction ID:</span>
                <strong style="color: #1e293b; font-family: monospace; font-size: 12px;">${razorpayPaymentId}</strong>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px;">
            <p style="color: #475569; margin: 0; font-size: 14px;">
              This is an automated receipt for your records.<br>
              For any queries, please contact your society administrator.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              2024 FixMate Society Management System
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Payment Receipt Mail Sent]: " + info.response);
  } catch (error) {
    console.error("[Payment Receipt Mail Error]: ", error);
    throw error;
  }
};