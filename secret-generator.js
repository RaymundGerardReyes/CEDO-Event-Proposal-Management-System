// secret-generator.js
const crypto = require("crypto");

function generateSecret(length) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

const jwtSecret = generateSecret(32);
const jwtSecretDev = generateSecret(32);
const jwtSecretProd = generateSecret(64);

console.log("JWT_SECRET=" + jwtSecret);
console.log("JWT_SECRET_DEV=" + jwtSecretDev);
console.log("JWT_SECRET_PROD=" + jwtSecretProd);
