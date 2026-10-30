import { timeToMinutes } from './dateTime'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required'
  if (!emailPattern.test(email.trim())) return 'Enter a valid email address'
  return ''
}

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Email is required'
  else if (!emailPattern.test(email.trim()))
    errors.email = 'Enter a valid email address'
  if (!password) errors.password = 'Password is required'
  return errors
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = validateLogin({ email, password })
  if (!name.trim()) errors.name = 'Full name is required'
  else if (name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters'
  if (password && password.length < 8)
    errors.password = 'Password must be at least 8 characters'
  if (!confirmPassword) errors.confirmPassword = 'Confirm your password'
  else if (confirmPassword !== password)
    errors.confirmPassword = 'Passwords do not match'
  return errors
}

const phonePattern = /^[0-9+()\-\s.]*$/

export function validateProfile({ name, email, phone, department, jobTitle }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Full name is required'
  else if (name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters'
  if (!email.trim()) errors.email = 'Email is required'
  else if (!emailPattern.test(email.trim()))
    errors.email = 'Enter a valid email address'
  if (phone.trim() && !phonePattern.test(phone.trim()))
    errors.phone = 'Phone can only contain digits, spaces and + - ( )'
  if (department.length > 100)
    errors.department = 'Department can have at most 100 characters'
  if (jobTitle.length > 100)
    errors.jobTitle = 'Job title can have at most 100 characters'
  return errors
}

export function validatePasswordChange({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  const errors = {}
  if (!currentPassword) errors.currentPassword = 'Enter your current password'
  if (!newPassword) errors.newPassword = 'Enter a new password'
  else if (newPassword.length < 8)
    errors.newPassword = 'Password must be at least 8 characters'
  else if (newPassword === currentPassword)
    errors.newPassword = 'Choose a password different from the current one'
  if (!confirmPassword) errors.confirmPassword = 'Confirm your new password'
  else if (confirmPassword !== newPassword)
    errors.confirmPassword = 'Passwords do not match'
  return errors
}

export function validateEmployee(
  { name, email, password, role },
  { requirePassword },
) {
  const errors = validateProfile({
    name,
    email,
    phone: '',
    department: '',
    jobTitle: '',
  })
  if (!role) errors.role = 'Choose a role'
  if (requirePassword) {
    if (!password) errors.password = 'Set a starting password'
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters'
  }
  return errors
}

export function validateResource({ name, type, capacity, facilities }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Name is required'
  else if (name.trim().length > 100)
    errors.name = 'Name can have at most 100 characters'
  if (type === 'room') {
    if (capacity === '' || capacity === null)
      errors.capacity = 'Capacity is required for rooms'
    else if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1)
      errors.capacity = 'Capacity must be a whole number above 0'
  }
  if (facilities.length > 500)
    errors.facilities = 'Facilities can have at most 500 characters'
  return errors
}

export function validateHours(rows) {
  const errors = {}
  rows.forEach((row) => {
    if (!row.isOpen) return
    if (!row.openTime || !row.closeTime)
      errors[row.dayOfWeek] = 'Set both times'
    else if (timeToMinutes(row.openTime) >= timeToMinutes(row.closeTime))
      errors[row.dayOfWeek] = 'Closing time must be after opening time'
  })
  return errors
}

export function validateRestrictions(values) {
  const errors = {}
  const fields = [
    ['minDurationMinutes', 'Minimum length'],
    ['maxDurationMinutes', 'Maximum length'],
    ['maxAdvanceDays', 'Advance days'],
    ['slotStepMinutes', 'Slot step'],
  ]
  fields.forEach(([key, label]) => {
    const value = Number(values[key])
    if (values[key] === '' || !Number.isInteger(value) || value < 1)
      errors[key] = `${label} must be a whole number above 0`
  })
  if (
    !errors.minDurationMinutes &&
    !errors.maxDurationMinutes &&
    Number(values.minDurationMinutes) > Number(values.maxDurationMinutes)
  ) {
    errors.maxDurationMinutes = 'Maximum cannot be less than minimum'
  }
  if (
    !errors.slotStepMinutes &&
    !errors.minDurationMinutes &&
    Number(values.minDurationMinutes) % Number(values.slotStepMinutes)
  ) {
    errors.minDurationMinutes = 'Minimum length should fit the slot step'
  }
  return errors
}
