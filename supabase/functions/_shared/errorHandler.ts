/**
 * Centralized Error Handling & Sanitization
 * Prevents leaking internal implementation details in production
 */

export interface SanitizedError {
  error: string;
  code?: string;
  details?: string;
}

/**
 * Sanitize error for client response
 * Hides sensitive stack traces and internal errors
 */
export function sanitizeError(error: unknown, isDevelopment = false): SanitizedError {
  // In development, return full error details
  if (isDevelopment && Deno.env.get('ENVIRONMENT') === 'development') {
    if (error instanceof Error) {
      return {
        error: error.message,
        code: 'INTERNAL_ERROR',
        details: error.stack,
      };
    }
    return {
      error: String(error),
      code: 'UNKNOWN_ERROR',
    };
  }

  // In production, return generic messages
  if (error instanceof Error) {
    // Known error types with safe messages
    const safeMessages: Record<string, string> = {
      'Missing authorization header': 'Authentication required',
      'Unauthorized': 'Invalid or expired session',
      'Rate limit exceeded': 'Too many requests. Please try again later.',
      'Invalid MT5 token': 'Invalid authentication token',
      'Account number is required': 'Missing required fields',
      'App code is required': 'Missing required fields',
      'Invalid symbol': 'Invalid trading symbol',
      'Price out of range': 'Invalid price data',
      'Encryption key not configured': 'Server configuration error',
    };

    const safeMessage = safeMessages[error.message];
    if (safeMessage) {
      return { error: safeMessage };
    }

    // Generic message for unknown errors
    return {
      error: 'An error occurred processing your request',
      code: 'INTERNAL_ERROR',
    };
  }

  // Fallback for non-Error objects
  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Log error with context for debugging
 */
export function logError(
  functionName: string,
  error: unknown,
  context?: Record<string, any>
) {
  console.error(`[${functionName}] Error:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create error response with CORS headers
 */
export function createErrorResponse(
  error: unknown,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  const sanitized = sanitizeError(error);
  
  return new Response(
    JSON.stringify(sanitized),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
