// Email validation - accepts any valid email
const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address';
  }
  return null;
};

module.exports = {
  validateEmail
};
