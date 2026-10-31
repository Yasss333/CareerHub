import test from 'node:test';
import assert from 'node:assert/strict';
import {interviewReportHtml} from './interview-report.js';
test('PDF HTML encodes private answers and keeps zero and missing signals distinct',()=>{
 const html=interviewReportHtml({id:'qa',type:'technical',topics:['<script>fetch("https://evil.test")</script>'],startedAt:new Date().toISOString(),feedback:{overallScore:0},questions:[{questionText:'<img src="https://evil.test/track">',answerText:'<script>location="https://evil.test"</script>'}]});
 assert.match(html,/0%/);assert.match(html,/Not available/);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.match(html,/&lt;script&gt;/);
});
