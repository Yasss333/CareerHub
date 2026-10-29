export class ClientInputError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const bodyObject = (value) => {
  if (!object(value)) throw new ClientInputError('A JSON object is required');
  return value;
};
const emailAddress = (value) => {
  if (typeof value !== 'string') throw new ClientInputError('Enter a valid email address');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ClientInputError('Enter a valid email address');
  return email;
};

export function parseRegistration(value) {
  const input = bodyObject(value);
  const email = emailAddress(input.email);
  if (typeof input.password !== 'string' || input.password.length < 6 || Buffer.byteLength(input.password, 'utf8') > 72) throw new ClientInputError('Password must contain at least 6 characters and at most 72 bytes');
  if (input.name !== undefined && (typeof input.name !== 'string' || input.name.trim().length > 80)) throw new ClientInputError('Name must contain at most 80 characters');
  if (input.role !== undefined && !['USER', 'MENTOR'].includes(input.role)) throw new ClientInputError('Choose a user or mentor account');
  return { ...input, email, name: input.name?.trim() || email.split('@')[0].slice(0, 80) };
}

export function parseLogin(value) {
  const input = bodyObject(value);
  const email = emailAddress(input.email);
  if (typeof input.password !== 'string' || !input.password || input.password.length > 1024) throw new ClientInputError('Enter a valid password');
  return { ...input, email };
}

export function validateResumeInput(value) {
  const input = { ...bodyObject(value) };
  for (const key of ['title', 'template', 'accentColor', 'professionSummary', 'profile']) {
    if (input[key] !== undefined && typeof input[key] !== 'string') throw new ClientInputError(`${key} must be text`);
  }
  for (const key of ['skills', 'personalInfo', 'experience', 'projects', 'education']) {
    if (input[key] === undefined) continue;
    if (typeof input[key] === 'string') {
      try { input[key] = JSON.parse(input[key]); } catch { throw new ClientInputError(`${key} must contain valid JSON`); }
    }
    if (key === 'personalInfo') {
      if (!object(input[key])) throw new ClientInputError('personalInfo must be an object');
    } else {
      if (!Array.isArray(input[key])) throw new ClientInputError(`${key} must be an array`);
      if (key === 'skills' && !input[key].every((skill) => typeof skill === 'string')) throw new ClientInputError('Skills must be text values');
      if (key !== 'skills' && !input[key].every(object)) throw new ClientInputError(`${key} must contain objects`);
    }
  }
  if (input.public === 'true') input.public = true;
  if (input.public === 'false') input.public = false;
  if (input.public !== undefined && typeof input.public !== 'boolean') throw new ClientInputError('public must be a boolean');
  return input;
}
