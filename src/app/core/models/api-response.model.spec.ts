import { describe, it, expect } from 'vitest';
import { extractErrorMessage, extractSuccessMessage } from './api-response.model';

describe('ApiResponse extraction utilities', () => {
  describe('extractErrorMessage', () => {
    it('should extract error message from standard ResponseWrapper envelope (400 validation)', () => {
      const error = {
        status: 400,
        error: {
          requestId: 'req-123',
          operationMode: 'VALIDATION',
          status: {
            timestamp: '21-08-2026',
            status: 'FAILED',
            message: 'Invalid product price details provided',
          },
          data: [],
        },
      };
      expect(extractErrorMessage(error)).toBe('Invalid product price details provided');
    });

    it('should extract error message from flat error object (404 not found)', () => {
      const error = {
        status: 404,
        error: {
          message: 'Product not found',
          status: 'FAILED',
        },
      };
      expect(extractErrorMessage(error)).toBe('Product not found');
    });

    it('should extract conflict error message (409 conflict)', () => {
      const error = {
        status: 409,
        error: {
          status: {
            message: 'User with this mobile number already exists',
            status: 'FAILED',
          },
        },
      };
      expect(extractErrorMessage(error)).toBe('User with this mobile number already exists');
    });

    it('should parse JSON string in error.error body', () => {
      const error = {
        status: 400,
        error: JSON.stringify({
          status: {
            message: 'Duplicate pack size configuration',
          },
        }),
      };
      expect(extractErrorMessage(error)).toBe('Duplicate pack size configuration');
    });

    it('should fallback to HTTP 401 default message when backend provides no body', () => {
      const error = { status: 401, error: null };
      expect(extractErrorMessage(error)).toBe('Authentication failed or session expired. Please sign in again.');
    });

    it('should fallback to HTTP 403 default message when backend provides no body', () => {
      const error = { status: 403, error: null };
      expect(extractErrorMessage(error)).toBe('Access Denied: You do not have permission to perform this action.');
    });

    it('should fallback to HTTP 500 default message when backend provides no body', () => {
      const error = { status: 500, error: null };
      expect(extractErrorMessage(error)).toBe('Internal server error occurred. Please try again later.');
    });

    it('should handle network connection failure (status 0)', () => {
      const error = { status: 0, error: null };
      expect(extractErrorMessage(error)).toBe('Unable to connect to the server. Please check your internet connection.');
    });
  });

  describe('extractSuccessMessage', () => {
    it('should extract success message from ResponseWrapper status object', () => {
      const response = {
        requestId: 'req-456',
        operationMode: 'UPDATE',
        status: {
          status: 'SUCCESS',
          message: 'Product Updated Successfully',
        },
        data: [{ productCd: 1 }],
      };
      expect(extractSuccessMessage(response)).toBe('Product Updated Successfully');
    });

    it('should extract message from flat message property', () => {
      const response = {
        message: 'Order placed successfully',
        data: [],
      };
      expect(extractSuccessMessage(response)).toBe('Order placed successfully');
    });

    it('should use fallback when response has no message', () => {
      const response = { data: [] };
      expect(extractSuccessMessage(response, 'Default Success')).toBe('Default Success');
    });
  });
});
