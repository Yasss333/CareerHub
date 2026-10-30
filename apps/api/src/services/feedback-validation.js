export class FeedbackInputError extends Error { status = 400; }
export const feedbackStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const text = (value, label, min, max) => {
  if (value === undefined && min === 0) return '';
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new FeedbackInputError(`${label} must be ${min ? `${min}–` : 'at most '}${max} characters`);
  return value.trim();
};
export function parseFeedback(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new FeedbackInputError('Invalid report');
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) throw new FeedbackInputError('Invalid report request ID');
  if (!['bug', 'suggestion'].includes(body.kind)) throw new FeedbackInputError('Choose bug or suggestion');
  const rawPath = body.context?.path;
  if (typeof rawPath !== 'string' || rawPath.length > 1000 || !/^\/(?!\/)/.test(rawPath)) throw new FeedbackInputError('Invalid report page');
  const path = rawPath.split(/[?#]/)[0];
  if (path.length > 240 || !/^\/[a-z0-9/_-]*$/i.test(path) || path.startsWith('/api/')) throw new FeedbackInputError('Invalid report page');
  const module = /^\/interview(?:\/|$)/.test(path) ? 'AI Interview' : /^\/resume(?:-builder)?(?:\/|$)/.test(path) ? 'Resume Builder' : /^\/(?:connect|mentor)(?:\/|$)/.test(path) ? 'Senior Connect' : path.startsWith('/algorank') ? 'AlgoRank' : path.startsWith('/roadmaps') ? 'Roadmaps' : path.includes('settings') ? 'Settings' : path.startsWith('/admin') ? 'Admin' : path === '/' ? 'Dashboard' : 'Other';
  const context = { path, module, browser: text(body.context?.browser, 'Browser context', 0, 250) };
  if (body.context?.viewport !== undefined) {
    const { width, height } = body.context.viewport || {};
    if (![width, height].every(value => Number.isInteger(value) && value > 0 && value <= 20000)) throw new FeedbackInputError('Invalid viewport');
    context.viewport = { width, height };
  }
  return { requestId: body.requestId, payload: { schemaVersion: 1, kind: body.kind, title: text(body.title, 'Title', 6, 140), description: text(body.description, 'Description', 10, 4000), steps: text(body.steps, 'Steps', 0, 2000), expected: text(body.expected, 'Expected behavior', 0, 1000), actual: text(body.actual, 'Actual behavior', 0, 1000), context } };
}
