/**
 * Standard API Response envelope matching the Java ResponseWrapper format.
 */
export interface StatusEnvelope {
  timestamp?: string;
  status?: string; // 'SUCCESS' | 'FAIL' | 'FAILED'
  message?: string;
}

export interface ApiResponse<T = any> {
  requestId?: string;
  operationMode?: string;
  status?: StatusEnvelope | string;
  message?: string;
  data?: T;
}

/**
 * Extracts a human-readable error message from any backend HTTP error response.
 */
export function extractErrorMessage(error: any): string {
  if (!error) {
    return 'An unexpected error occurred.';
  }

  // If error.error is a string (e.g. text/plain or raw JSON string)
  if (typeof error.error === 'string') {
    try {
      const parsed = JSON.parse(error.error);
      return extractErrorMessage({ error: parsed, status: error.status });
    } catch {
      if (error.error.trim().length > 0 && !error.error.trim().startsWith('<')) {
        return error.error.trim();
      }
    }
  }

  // ResponseWrapper standard envelope: error.error.status.message
  if (
    error.error?.status &&
    typeof error.error.status === 'object' &&
    error.error.status.message &&
    typeof error.error.status.message === 'string'
  ) {
    return error.error.status.message;
  }

  // Flat message in error body: error.error.message
  if (error.error?.message && typeof error.error.message === 'string') {
    return error.error.message;
  }

  // If status property itself contains a descriptive message
  if (
    error.error?.status &&
    typeof error.error.status === 'string' &&
    error.error.status !== 'FAIL' &&
    error.error.status !== 'FAILED'
  ) {
    return error.error.status;
  }

  // HTTP Status fallback mappings when no specific backend message is available
  switch (error.status) {
    case 0:
      return 'Unable to connect to the server. Please check your internet connection.';
    case 400:
      return 'Invalid request details provided.';
    case 401:
      return 'Authentication failed or session expired. Please sign in again.';
    case 403:
      return 'Access Denied: You do not have permission to perform this action.';
    case 404:
      return 'Requested resource could not be found.';
    case 409:
      return 'Conflict: Record or resource already exists.';
    case 500:
      return 'Internal server error occurred. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return error.statusText || error.message || 'An unexpected error occurred.';
  }
}

/**
 * Extracts a success message from an API response if available.
 */
export function extractSuccessMessage(response: any, fallbackMessage = 'Operation completed successfully'): string {
  if (!response) {
    return fallbackMessage;
  }

  if (response.status && typeof response.status === 'object' && response.status.message) {
    return response.status.message;
  }

  if (typeof response.message === 'string' && response.message.trim().length > 0) {
    return response.message;
  }

  return fallbackMessage;
}
