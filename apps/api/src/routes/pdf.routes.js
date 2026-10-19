import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Generate a downloadable PDF from a resume.
router.post('/:id/pdf', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const pdf = await generateResumePdf(resume);
    const filename = `${resume.title.replace(/[^a-z0-9_-]+/gi, '_') || 'resume'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    return res.send(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export const generateResumePdf = async (resume) => {
  const browser = await puppeteer.launch({
    headless: true,
    ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(generateResumeHTML(resume), { waitUntil: 'networkidle0' });
    const contentHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    const printableHeight = ((297 - 24) * 96) / 25.4;
    const scale = Math.min(1, printableHeight / Math.max(contentHeight, 1));
    if (scale < 1) await page.addStyleTag({ content: `body { zoom: ${scale}; }` });
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
};

// Helper function to generate HTML for resume
function generateResumeHTML(resume) {
  const personalInfo = resume.personalInfo || {};
  const experience = resume.experience || [];
  const projects = resume.projects || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  
  const accentColor = /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(resume.accentColor || '') ? resume.accentColor : '#3B82F6';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(resume.title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      color: #333;
      font-size: 10pt;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .name {
      font-size: 28px;
      font-weight: bold;
      color: ${accentColor};
      margin-bottom: 6px;
    }
    .contact-info {
      font-size: 14px;
      color: #666;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: ${accentColor};
      margin-bottom: 8px;
      text-transform: uppercase;
      border-bottom: 1px solid #ddd;
      padding-bottom: 3px;
    }
    .item {
      margin-bottom: 9px;
    }
    .item-title {
      font-weight: bold;
      font-size: 16px;
    }
    .item-subtitle {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .item-description {
      font-size: 14px;
      line-height: 1.5;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill {
      background: ${accentColor}20;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
    }
    .summary {
      font-size: 14px;
      line-height: 1.6;
    }
    @media print {
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section, .item { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(personalInfo.fullName || 'Your Name')}</div>
    <div class="contact-info">
      ${personalInfo.email ? `${escapeHtml(personalInfo.email)} | ` : ''}
      ${personalInfo.phone ? `${escapeHtml(personalInfo.phone)} | ` : ''}
      ${personalInfo.location ? escapeHtml(personalInfo.location) : ''}
      ${personalInfo.linkedin ? `<br/>LinkedIn: ${escapeHtml(personalInfo.linkedin)}` : ''}
      ${personalInfo.website ? `<br/>Website: ${escapeHtml(personalInfo.website)}` : ''}
    </div>
  </div>

  ${resume.professionSummary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${escapeHtml(resume.professionSummary)}</div>
  </div>
  ` : ''}

  ${experience.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${experience.map(exp => `
      <div class="item">
        <div class="item-title">${escapeHtml(exp.position || 'Position')}</div>
        <div class="item-subtitle">${escapeHtml(exp.company || 'Company')} | ${escapeHtml(exp.startDate || '')} - ${exp.isCurrent ? 'Present' : escapeHtml(exp.endDate || '')}</div>
        <div class="item-description">${escapeHtml(exp.description || '')}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${projects.length > 0 ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projects.map(project => `
      <div class="item">
        <div class="item-title">${escapeHtml(project.name || 'Project Name')}</div>
        <div class="item-subtitle">${escapeHtml(project.type || 'Project Type')}</div>
        <div class="item-description">${escapeHtml(project.description || '')}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${education.map(edu => `
      <div class="item">
        <div class="item-title">${escapeHtml(edu.degree || 'Degree')}</div>
        <div class="item-subtitle">${escapeHtml(edu.institution || 'Institution')} | ${escapeHtml(edu.field || 'Field')}</div>
        ${edu.gpa ? `<div class="item-subtitle">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills">
      ${skills.map(skill => `<div class="skill">${escapeHtml(skill)}</div>`).join('')}
    </div>
  </div>
  ` : ''}
  
</body>
</html>
  `;
}

export default router;