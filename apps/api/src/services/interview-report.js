import PDFDocument from 'pdfkit';

const text = value => String(value ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
const percentage = value => Number.isFinite(value) ? `${Math.round(value)}%` : 'Not available';

// Render directly in Node: no executable, display server, HTML or external resources.
export function generateInterviewReportPdf(session) {
  return new Promise((resolve,reject) => {
    const doc = new PDFDocument({size:'A4',margin:44,bufferPages:true,info:{Title:'CareerHub interview report',Author:'CareerHub'}});
    const chunks=[];
    doc.on('data',chunk=>chunks.push(chunk));doc.on('error',reject);doc.on('end',()=>resolve(Buffer.concat(chunks)));
    const width=doc.page.width-88;
    const write=(value,{size=10,bold=false,color='#273449'}={})=>{
      doc.font(bold?'Helvetica-Bold':'Helvetica').fontSize(size).fillColor(color).text(text(value),44,doc.y,{width,lineGap:3});doc.moveDown(.4);
    };
    const section=title=>{if(doc.y>doc.page.height-115)doc.addPage();doc.moveDown(.7);write(title,{size:15,bold:true,color:'#6366f1'});};
    const list=items=>{if(!Array.isArray(items)||!items.length){write('None recorded.',{color:'#64748b'});return}for(const item of items)write(`- ${text(item)}`);};
    const feedback=session.feedback||{};
    const events=(session.proctoringEvents||[]).filter(e=>e.eventType!=='screen_heartbeat');
    const warnings=events.filter(e=>e.severity==='warning');
    try {
      doc.rect(44,38,width,5).fill('#8b5cf6');doc.y=58;
      write('CareerHub / Interview analytics',{bold:true,color:'#6366f1'});
      write('Performance report',{size:26,bold:true});
      write(`${session.role||session.type} / ${(session.topics||[]).join(', ')}`);
      write(`${new Date(session.startedAt).toLocaleString('en-GB',{timeZone:'UTC'})} UTC / Session ${session.id}`,{size:8,color:'#64748b'});
      const top=doc.y+12,cell=(width-20)/3;
      for(const [i,[value,label]] of [[percentage(feedback.overallScore),'Answer score'],[String((session.questions||[]).length),'Questions'],[String(warnings.length),'Monitoring incidents']].entries()){
        const x=44+i*(cell+10);doc.roundedRect(x,top,cell,70,8).fill('#f1efff');
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#6366f1').text(value,x+13,top+13,{width:cell-26});
        doc.font('Helvetica').fontSize(9).fillColor('#475569').text(label,x+13,top+48,{width:cell-26});
      }
      doc.y=top+85;
      write(`Duration: ${Number.isFinite(session.durationSeconds)?Math.round(session.durationSeconds/60)+' minutes':'Not recorded'} / Difficulty: ${session.difficulty||'Not recorded'}`,{size:9,color:'#64748b'});
      section('AI coach feedback');write(feedback.overallFeedback||'Not available');
      write('Strengths',{bold:true});list(feedback.strengths);write('Areas to improve',{bold:true});list(feedback.areasToImprove);
      section('Optional coaching signals');
      for(const modality of ['face','voice','text']){
        const result=(session.emotionResults||[]).filter(e=>e.modality===modality&&e.result.source==='ml'&&e.result.success===true).at(-1)?.result;
        write(`${modality[0].toUpperCase()+modality.slice(1)} emotion: ${result?.emotion||'Not available'}${Number.isFinite(result?.confidence)?` / Confidence: ${Math.round(result.confidence*100)}%`:''}`);
      }
      const fusion=(session.emotionResults||[]).filter(e=>e.modality==='fusion'&&e.result.source==='ml'&&e.result.success===true).at(-1)?.result;
      if(fusion?.emotions){write('Combined emotion distribution',{bold:true});for(const [name,value] of Object.entries(fusion.emotions))if(Number.isFinite(value))write(`${name}: ${Math.round(value*100)}%`);}
      if(fusion?.behavioral_metrics){write('Experimental behavioral estimates',{bold:true});for(const [name,value] of Object.entries(fusion.behavioral_metrics))if(Number.isFinite(value))write(`${name}: ${value.toFixed(1)}`);}
      write('Model estimates support reflection and do not affect your answer score or PRI. Missing output is not a neutral emotion.',{size:9,color:'#64748b'});
      if(session.candidateIntroduction){section('Your introduction');write(session.candidateIntroduction);}
      section('Question-by-question feedback');
      for(const [index,q] of (session.questions||[]).entries()){
        if(doc.y>doc.page.height-120)doc.addPage();
        write(`${index+1}. ${q.questionText}`,{size:12,bold:true});write(`Score: ${percentage(q.questionFeedback?.score)}`,{color:'#6366f1'});
        write('Your answer',{bold:true});write(q.answerText||'No answer recorded.');write(q.questionFeedback?.feedback||'No evaluation recorded.');
        for(const [label,items] of [['Strengths',q.questionFeedback?.strengths],['Improvements',q.questionFeedback?.improvements],['Missed points',q.questionFeedback?.missedPoints]])if(items?.length){write(label,{bold:true});list(items);}
        doc.moveDown(.5);
      }
      section('Monitoring timeline');
      write('Browser events are client-reported signals. They do not prove cheating or establish identity.',{size:9,color:'#64748b'});
      if(!events.length)write('No monitoring events recorded.');
      for(const event of events)write(`${new Date(event.createdAt).toISOString()} / ${event.eventType.replaceAll('_',' ')} / ${event.severity}`,{size:9});
      const range=doc.bufferedPageRange();
      for(let i=range.start;i<range.start+range.count;i++){
        doc.switchToPage(i);const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;
        doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`CareerHub / Private interview report / ${i+1} of ${range.count}`,44,doc.page.height-28,{width,lineBreak:false});doc.page.margins.bottom=bottom;
      }
      doc.end();
    } catch(error){doc.destroy();reject(error);}
  });
}
