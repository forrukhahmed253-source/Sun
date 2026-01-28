const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate secure random string
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Encrypt sensitive data
const encrypt = (text, key = process.env.ENCRYPTION_KEY) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
};

// Decrypt data
const decrypt = (encryptedData, key = process.env.ENCRYPTION_KEY) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Hash data with salt
const hashData = async (data) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(data, salt);
};

// Compare hashed data
const compareHash = async (data, hash) => {
  return bcrypt.compare(data, hash);
};

// Generate HMAC signature
const generateHMAC = (data, secret = process.env.HMAC_SECRET) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
};

// Verify HMAC signature
const verifyHMAC = (data, signature, secret = process.env.HMAC_SECRET) => {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

// Generate API key
const generateAPIKey = () => {
  const prefix = 'sbk_';
  const random = crypto.randomBytes(24).toString('hex');
  const timestamp = Date.now().toString(16);
  return prefix + random + timestamp;
};

// Generate secure token for email verification, password reset, etc.
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateSecureRandom,
  encrypt,
  decrypt,
  hashData,
  compareHash,
  generateHMAC,
  verifyHMAC,
  generateAPIKey,
  generateSecureToken
};
