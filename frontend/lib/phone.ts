export function formatTajikPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("992") ? digits.slice(3) : digits;
  return `+992${local.slice(0, 9)}`;
}

export function isTajikPhone(value: string) {
  return /^\+992\d{9}$/.test(value);
}

export function hasLetterAndNumber(value: string) {
  return /\p{L}/u.test(value) && /\d/.test(value);
}
