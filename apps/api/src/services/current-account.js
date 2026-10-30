import {timingSafeEqual} from 'node:crypto';
// Privilege decisions use the current account, never an old role claim in a JWT.
export async function currentAccount(database, decoded) {
  if (typeof decoded?.id !== 'string' || !decoded.id.trim()) return null;
  return database.user.findUnique({where: {id: decoded.id}, select: {id: true, email: true, role: true}});
}

export function isSeedKeyAuthorized(header, configured) {
  if (typeof configured !== 'string' || configured.length < 32 || typeof header !== 'string') return false;
  const expected = Buffer.from(configured), supplied = Buffer.from(header);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
