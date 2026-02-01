const {body, validationResult}= require('express-validator');
// const {validationResult} = require("expess-validator");

//name email passw confirm_passw
const signupRules= [
    body("name").trim().isLength({
        min:3, max:15
    }).withMessage("name should be of minimum length 3 and maximum of length 15"),

    body("email").trim().matches(/^[a-zA-Z0-9._]+@gmail\.com$/).withMessage("Incorrect gmail format please write a valid email"),
    
    //using positive lookahead ?= *[pattern]
    body("password").trim().matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage("password should contain atleast one uppper case, one lower case , one digit and one special character and should have atleast 8 characters"),

    body("confirm_password").trim().custom((value, {req})=>{
     if(value!=req.body.password){
     throw new Error("Password mismatch!");
     }
     return true
    }),
  ];

const validate = (req, res, next) => {
  // console.log("Body Object",req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    console.log(errors.array());
    return res.status(400).json(
      { errors: errors.array() }
    );
  }
  next();
}  

module.exports = { signupRules, validate };