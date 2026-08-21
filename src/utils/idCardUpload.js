export const ID_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

const isImage = (file) =>
  /^image\/(jpeg|jpg|png|webp)$/i.test(file.type) ||
  /\.(jpe?g|png|webp)$/i.test(file.name || '');

const checkFile = (file, label) => {
  if (!isImage(file)) {
    return `${label} must be a JPG, PNG, or WEBP photo`;
  }
  if (file.size > 5 * 1024 * 1024) {
    return `${label} must be 5MB or smaller`;
  }
  return '';
};

export const validateIdImages = (front, back, docType) => {
  if (docType === 'B-Form') {
    if (!front) return 'Please upload a photo of the B-Form';
    return checkFile(front, 'B-Form photo');
  }

  if (!front || !back) {
    return 'Please upload both the front and back photos of the CNIC';
  }

  const frontError = checkFile(front, 'Front photo');
  if (frontError) return frontError;
  const backError = checkFile(back, 'Back photo');
  if (backError) return backError;

  if (
    front.name === back.name &&
    front.size === back.size &&
    front.lastModified === back.lastModified
  ) {
    return 'Front and back must be two different photos of the CNIC';
  }

  return '';
};

export const mediaUrl = (path) => {
  if (!path) return '';
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  return `${base}${path}`;
};
