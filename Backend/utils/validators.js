exports.validatePassword = (password) => {
  // At least 8 characters, 1 uppercase letter, 1 number
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

exports.validateEmail = (email) => {
  // Basic email validation
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
