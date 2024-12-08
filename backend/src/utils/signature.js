const crypto = require('crypto');

/**
 * Ký dữ liệu bằng khóa riêng tư
 * @param {Buffer} data - Nội dung cần ký
 * @param {string} privateKey - Khóa riêng tư (PEM)
 * @returns {string} - Chữ ký (hex)
 */
const signData = (data, privateKey) => {
  const hash = crypto.createHash('sha256').update(data).digest('hex'); // Tạo hash từ nội dung
  const signer = crypto.createSign('SHA256');
  signer.update(hash);
  signer.end();
  return signer.sign(privateKey, 'hex'); // Trả về chữ ký
};

module.exports = { signData };
