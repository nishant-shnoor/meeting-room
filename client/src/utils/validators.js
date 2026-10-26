const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!emailPattern.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = validateLogin({ email, password });
  if (!name.trim()) errors.name = "Full name is required";
  else if (name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  if (password && password.length < 8)
    errors.password = "Password must be at least 8 characters";
  if (!confirmPassword) errors.confirmPassword = "Confirm your password";
  else if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}
