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
      subject: "Welcome to FixMate – Your Account Details",
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