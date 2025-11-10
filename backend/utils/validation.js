const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // At least 6 characters
    return password && password.length >= 6;
};

const validateResetToken = (token) => {
    // Basic token validation - should be hex string of proper length
    return token && typeof token === 'string' && token.length === 40;
};

module.exports = {
    validateEmail,
    validatePassword,
    validateResetToken
};