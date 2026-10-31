import puppeteer from 'puppeteer';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const score = value => Number.isFinite(value) ? `${Math.round(value)}%` : 'Not available';
const list = values => Array.isArray(values) && values.length ? `<ul>${values.map(v => `<li>${escape(v)}</li>`).join('')}</ul>` : '<p>None recorded.</p>';
export function interviewReportHtml(session) {
  const feedback = session.feedback || {};
  const events = (session.proctoringEvents || []).filter(e => e.eventType !== 'screen_heartbeat');
  const warnings = events.filter(e => e.severity === 'warning');
  const signals = ['face','voice','text'].map(modality => {
    const result = (session.emotionResults || []).filter(e => e.modality === modality && e.result.source === 'ml' && e.result.success === true).at(-1)?.result;
    return `<div><b>${escape(modality)} emotion</b><p>${escape(result?.emotion || 'Not available')}</p></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>CareerHub interview report</title><style>
  @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:11pt/1.6 Arial,sans-serif;color:#172033;margin:0}h1{font-size:27pt;margin:8px 0}h2{font-size:16pt;color:#6366f1;margin-top:25px}h3{font-size:12pt}p,li{white-space:pre-wrap;overflow-wrap:anywhere}.hero{border-top:7px solid #8b5cf6;border-bottom:1px solid #ddd;padding:16px 0}.muted{color:#586174;font-size:9pt}.metrics{display:flex;gap:20px;margin:20px 0}.metrics>div{flex:1;background:#f4f3ff;padding:15px;border-radius:12px}.number{display:block;font-size:25pt;color:#6366f1}.question{border-top:1px solid #ddd;padding-top:8px}.answer{background:#f5f6f8;padding:12px}h2,h3{break-after:avoid}li{break-inside:avoid}footer{border-top:1px solid #ddd;margin-top:25px;padding-top:10px}</style></head><body>
  <header class="hero"><b>CareerHub · Interview analytics</b><h1>Performance report</h1><p>${escape(session.role || session.type)} · ${escape((session.topics || []).join(' · '))}</p><p class="muted">${escape(new Date(session.startedAt).toLocaleString('en-GB', {timeZone:'UTC'}))} UTC · Session ${escape(session.id)}</p></header>
  <div class="metrics"><div><span class="number">${score(feedback.overallScore)}</span>Answer score</div><div><span class="number">${(session.questions || []).length}</span>Questions</div><div><span class="number">${warnings.length}</span>Monitoring incidents</div></div><p class="muted">Duration: ${Number.isFinite(session.durationSeconds) ? Math.round(session.durationSeconds / 60) + ' minutes' : 'Not recorded'} · Difficulty: ${escape(session.difficulty || 'Not recorded')}</p>
  <h2>AI coach feedback</h2><p>${escape(feedback.overallFeedback || 'Not available')}</p><h3>Strengths</h3>${list(feedback.strengths)}<h3>Areas to improve</h3>${list(feedback.areasToImprove)}
  <h2>Optional coaching signals</h2><div class="metrics">${signals}</div><p class="muted">Model estimates support reflection and do not affect your answer score or PRI. Missing output is not a neutral emotion.</p>
  ${session.candidateIntroduction ? `<h2>Your introduction</h2><p>${escape(session.candidateIntroduction)}</p>` : ''}
  <h2>Question-by-question feedback</h2>${(session.questions || []).map((q,i) => `<article class="question"><h3>${i+1}. ${escape(q.questionText)}</h3><p class="muted">Score: ${score(q.questionFeedback?.score)}</p><p class="answer">${escape(q.answerText || 'No answer recorded.')}</p><p>${escape(q.questionFeedback?.feedback || 'No evaluation recorded.')}</p><h3>Strengths</h3>${list(q.questionFeedback?.strengths)}<h3>Improvements</h3>${list(q.questionFeedback?.improvements)}${q.questionFeedback?.missedPoints?.length ? `<h3>Missed points</h3>${list(q.questionFeedback.missedPoints)}` : ''}</article>`).join('')}
  <h2>Monitoring timeline</h2><p class="muted">Browser events are client-reported signals and do not prove cheating or establish identity. Repeated signals from one incident are grouped.</p>${list(events.map(e => `${new Date(e.createdAt).toISOString()} · ${e.eventType.replaceAll('_',' ')} · ${e.severity}`))}
  <footer class="muted">CareerHub · Private interview report</footer></body></html>`;
}

export async function generateInterviewReportPdf(session) {
  const browser = await puppeteer.launch({headless:true, ...(process.env.PUPPETEER_EXECUTABLE_PATH ? {executablePath:process.env.PUPPETEER_EXECUTABLE_PATH} : {}), args:['--no-sandbox','--disable-setuid-sandbox']});
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', request => request.abort());
    await page.setContent(interviewReportHtml(session), {waitUntil:'domcontentloaded'});
    return Buffer.from(await page.pdf({format:'A4', printBackground:true, preferCSSPageSize:true}));
  } finally {await browser.close();}
}
