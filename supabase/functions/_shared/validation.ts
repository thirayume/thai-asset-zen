// Input validation utilities for edge functions

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Sanitize text input to prevent XSS and injection attacks
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate number is within range
 */
export function validateNumber(
  value: number,
  min: number,
  max: number
): boolean {
  return !isNaN(value) && value >= min && value <= max;
}

/**
 * Validate stock symbol format (uppercase letters, 2-10 chars)
 */
export function validateStockSymbol(symbol: string): boolean {
  const symbolRegex = /^[A-Z]{2,10}$/;
  return symbolRegex.test(symbol);
}

/**
 * Validate price value
 */
export function validatePrice(price: number): ValidationResult {
  const errors: string[] = [];
  
  if (isNaN(price)) {
    errors.push('Price must be a valid number');
  } else if (price <= 0) {
    errors.push('Price must be positive');
  } else if (price > 1000000) {
    errors.push('Price exceeds maximum allowed value');
  } else if (!Number.isFinite(price)) {
    errors.push('Price must be a finite number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate shares quantity
 */
export function validateShares(shares: number): ValidationResult {
  const errors: string[] = [];
  
  if (isNaN(shares)) {
    errors.push('Shares must be a valid number');
  } else if (shares <= 0) {
    errors.push('Shares must be positive');
  } else if (!Number.isInteger(shares)) {
    errors.push('Shares must be a whole number');
  } else if (shares > 1000000000) {
    errors.push('Shares exceed maximum allowed value');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date is not in the future
 */
export function validatePastDate(dateString: string): ValidationResult {
  const errors: string[] = [];
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    } else if (date > now) {
      errors.push('Date cannot be in the future');
    } else if (date < new Date('1900-01-01')) {
      errors.push('Date is too far in the past');
    }
  } catch {
    errors.push('Invalid date format');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate gold weight in baht
 */
export function validateGoldWeight(weight: number): ValidationResult {
  const errors: string[] = [];
  
  if (isNaN(weight)) {
    errors.push('Weight must be a valid number');
  } else if (weight <= 0) {
    errors.push('Weight must be positive');
  } else if (weight < 0.01) {
    errors.push('Weight must be at least 0.01 baht');
  } else if (weight > 100) {
    errors.push('Weight cannot exceed 100 baht');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return { valid: false, errors };
  }
  
  for (const field of requiredFields) {
    if (!(field in body)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
