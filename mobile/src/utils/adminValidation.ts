// Admin validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
  return phoneRegex.test(phone);
};

export const validateForm = (formData: any, fields: string[]): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  fields.forEach(field => {
    const value = formData[field];

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    } else if (field === 'email' && !validateEmail(value)) {
      errors[field] = 'Invalid email address';
    } else if (field === 'phoneNumber' && !validatePhoneNumber(value)) {
      errors[field] = 'Invalid phone number';
    } else if (field === 'password' && value.length < 6) {
      errors[field] = 'Password must be at least 6 characters';
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const formatCurrency = (amount: number, currency: string = '₦'): string => {
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
