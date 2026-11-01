import test from 'node:test';
import assert from 'node:assert/strict';
import {generateInterviewReportPdf} from './interview-report.js';

test('user content is literal PDF text and never becomes script, links or images',async()=>{
 const pdf=await generateInterviewReportPdf({id:'qa',type:'technical',topics:['<script>fetch("https://evil.test")</script>'],startedAt:new Date().toISOString(),feedback:{overallScore:0},questions:[{questionText:'<img src="https://evil.test/track">',answerText:'<script>location="https://evil.test"</script>'}]});
 assert.equal(pdf.subarray(0,4).toString(),'%PDF');const structure=pdf.toString('latin1');assert.doesNotMatch(structure,/\/JavaScript|\/S \/URI|\/Subtype \/Image/);
});

test('report PDF succeeds even when Chromium is missing',async()=>{
 const previous=process.env.PUPPETEER_EXECUTABLE_PATH;process.env.PUPPETEER_EXECUTABLE_PATH='C:/missing/chromium-does-not-exist.exe';
 try{const pdf=await generateInterviewReportPdf({id:'qa',type:'technical',topics:['Databases'],startedAt:new Date().toISOString(),feedback:{overallScore:0,overallFeedback:'Synthetic feedback'},questions:[{questionText:'Explain indexes',answerText:'Read speed versus write cost.'}]});assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.ok(pdf.length>1000);}
 finally{if(previous===undefined)delete process.env.PUPPETEER_EXECUTABLE_PATH;else process.env.PUPPETEER_EXECUTABLE_PATH=previous;}
});
