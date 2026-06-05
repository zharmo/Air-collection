const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const isValidPassword = (password) => {
  // at least 6 characters
  return password && password.length >= 6;
};

module.exports = { isValidEmail, isValidPassword };