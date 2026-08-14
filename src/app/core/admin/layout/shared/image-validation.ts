export interface ImageValidationResult {
  valid: boolean;
  errorKey?: string;
}

const MAX_SIZE_BYTES = 200 * 1024; // 200 KB
const MAX_DIMENSION = 1000;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateProductImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      resolve({ valid: false, errorKey: 'IMAGE_ERROR_FORMAT' });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      resolve({ valid: false, errorKey: 'IMAGE_ERROR_SIZE' });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(objectUrl);

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({ valid: false, errorKey: 'IMAGE_ERROR_DIMENSIONS' });
        return;
      }

      if (width !== height) {
        resolve({ valid: false, errorKey: 'IMAGE_ERROR_ASPECT_RATIO' });
        return;
      }

      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, errorKey: 'IMAGE_ERROR_INVALID_FILE' });
    };

    img.src = objectUrl;
  });
}