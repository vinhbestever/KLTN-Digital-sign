const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const generateKeys = () => {
  // Đảm bảo thư mục 'keys/' tồn tại
  const keysDir = path.join(__dirname, '../../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir);
  }

  // Tạo cặp khóa RSA
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  // Lưu các tệp khóa
  fs.writeFileSync(
    path.join(keysDir, 'private.pem'),
    privateKey.export({ type: 'pkcs1', format: 'pem' })
  );
  fs.writeFileSync(
    path.join(keysDir, 'public.pem'),
    publicKey.export({ type: 'pkcs1', format: 'pem' })
  );

  console.log('Keys generated and saved to the "keys/" directory');
};

generateKeys();
