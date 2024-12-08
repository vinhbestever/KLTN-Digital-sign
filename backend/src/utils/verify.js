const crypto = require('crypto');

/**
 * Xác minh chữ ký
 * @param {string} hash - Hash của file
 * @param {string} signature - Chữ ký (hex)
 * @param {string} publicKey - Public Key (PEM)
 * @returns {boolean} - Kết quả xác minh
 */
const verifySignature = (hash, signature, publicKey) => {
  const verifier = crypto.createVerify('SHA256');
  verifier.update(hash);
  verifier.end();
  return verifier.verify(publicKey, signature, 'hex');
};

module.exports = { verifySignature };
