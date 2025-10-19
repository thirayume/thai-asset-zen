// Additional security validation for authentication

/**
 * Check if password has been compromised (basic check)
 * In production, integrate with HaveIBeenPwned API
 */
export const isWeakPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    '111111', '123123', 'admin', 'letmein', 'welcome'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Rate limit login attempts (client-side check)
 * Server-side validation is primary
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export const checkLoginAttempts = (email: string): { allowed: boolean; message?: string } => {
  const now = Date.now();
  const key = email.toLowerCase();
  
  let attempts = loginAttempts.get(key);
  
  if (!attempts || attempts.resetAt < now) {
    attempts = { count: 0, resetAt: now + 15 * 60 * 1000 }; // 15 minute window
    loginAttempts.set(key, attempts);
  }
  
  attempts.count++;
  
  if (attempts.count > 5) {
    const minutesLeft = Math.ceil((attempts.resetAt - now) / 60000);
    return {
      allowed: false,
      message: `Too many login attempts. Please try again in ${minutesLeft} minutes.`
    };
  }
  
  return { allowed: true };
};

/**
 * Reset login attempts on successful login
 */
export const resetLoginAttempts = (email: string) => {
  loginAttempts.delete(email.toLowerCase());
};

/**
 * Validate session token format (basic check)
 */
export const isValidSessionToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // JWT format: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Validate base64 encoding
    atob(parts[0]);
    atob(parts[1]);
    return true;
  } catch {
    return false;
  }
};
