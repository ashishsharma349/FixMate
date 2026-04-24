// const {body, validationResult}= require('express-validator');
// // const {validationResult} = require("expess-validator");

// //name email passw confirm_passw
// const signupRules= [
//     body("name").trim().isLength({
//         min:3, max:15
//     }).withMessage("name should be of minimum length 3 and maximum of length 15"),

//     body("email").trim().matches(/^[a-zA-Z0-9._]+@gmail\.com$/).withMessage("Incorrect gmail format please write a valid email"),
    
//     //using positive lookahead ?= *[pattern]
//     body("password").trim().matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
//     .withMessage("password should contain atleast one uppper case, one lower case , one digit and one special character and should have atleast 8 characters"),

//     body("confirm_password").trim().custom((value, {req})=>{
//      if(value!=req.body.password){
//      throw new Error("Password mismatch!");
//      }
//      return true
//     }),
//   ];

// const validate = (req, res, next) => {
//   // console.log("Body Object",req.body);
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
    
//     console.log(errors.array());
//     return res.status(400).json(
//       { errors: errors.array() }
//     );
//   }
//   next();
// }  

// module.exports = { signupRules, validate };


const { body, validationResult } = require('express-validator');

// Rules for admin creating a new user or staff
const createUserRules = [
  body("name").trim().isLength({ min: 3, max: 30 })
    .withMessage("Name should be between 3 and 30 characters"),

  body("email").trim().matches(/^[a-zA-Z0-9._]+@gmail\.com$/)
    .withMessage("Please provide a valid Gmail address"),

  body("userType").isIn(["user", "staff"])
    .withMessage("userType must be 'user' or 'staff'"),

  body("contact").trim().matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian mobile number"),

  // age is required only for users
  body("age").if(body("userType").equals("user"))
    .isInt({ min: 1, max: 120 }).withMessage("Please provide a valid age"),

  // department is required only for staff
  body("department").if(body("userType").equals("staff"))
    .isIn(['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security'])
    .withMessage("Invalid department"),
];

// Rules for changing password
const changePasswordRules = [
  body("newPassword").trim()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage("New password must have at least 8 characters with uppercase, lowercase, digit and special character"),

  body("confirmPassword").trim().custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error("Passwords do not match");
    return true;
  }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("[Validation Errors]:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { createUserRules, changePasswordRules, validate };