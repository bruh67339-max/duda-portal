// Password validation and security
// SECURITY: Enforce strong password policies

// Common passwords to reject (partial list)
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'abc123',
  'monkey',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  'welcome',
  'welcome1',
  'michael',
  'login',
  'admin',
  'admin123',
  'root',
  'toor',
  'pass',
  'test',
  'guest',
  'master',
  'changeme',
  'hello',
  'hello123',
  'secret',
  'secret123',
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password meets security requirements
 */
export function validatePassword(
  password: string,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];

  // Length check
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long');
  }

  // Character type checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  // Check if password contains email username
  if (email) {
    const username = email.split('@')[0]?.toLowerCase();
    if (username && password.toLowerCase().includes(username)) {
      errors.push('Password cannot contain your email username');
    }
  }

  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain three or more repeated characters');
  }

  // Check for sequential numbers
  if (/012|123|234|345|456|567|678|789|890/.test(password)) {
    errors.push('Password cannot contain sequential numbers');
  }

  // Check for sequential letters
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    errors.push('Password cannot contain sequential letters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;

  // Ensure at least one of each required type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password was recently used (requires password history in DB)
 * This is a placeholder - implement when password history table is added
 */
export async function isPasswordRecentlyUsed(
  _userId: string,
  _passwordHash: string
): Promise<boolean> {
  // TODO: Implement password history check
  // For now, always return false (password not recently used)
  return false;
}
