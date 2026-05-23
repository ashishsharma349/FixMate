const crypto = require("crypto");

function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&";

  // Ensure at least one character from each set to satisfy validations
  let pass = "";
  pass += upper[crypto.randomInt(0, upper.length)];
  pass += lower[crypto.randomInt(0, lower.length)];
  pass += digits[crypto.randomInt(0, digits.length)];
  pass += special[crypto.randomInt(0, special.length)];

  const all = upper + lower + digits + special;
  for (let i = 0; i < 4; i++) {
    pass += all[crypto.randomInt(0, all.length)];
  }

  // Shuffle securely using Fisher-Yates algorithm
  const arr = pass.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

module.exports = generateTempPassword;
