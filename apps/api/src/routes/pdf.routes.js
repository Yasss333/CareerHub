import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

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

// Generate PDF from resume (placeholder - PDF generation to be implemented)
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

    // PDF generation placeholder
    // For now, return HTML content that can be printed to PDF
    const htmlContent = generateResumeHTML(resume);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${resume.title.replace(/\s+/g, '_')}_resume.html"`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to generate HTML for resume
function generateResumeHTML(resume) {
  const personalInfo = resume.personalInfo || {};
  const experience = resume.experience || [];
  const projects = resume.projects || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${resume.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid ${resume.accentColor || '#3B82F6'};
      padding-bottom: 20px;
    }
    .name {
      font-size: 28px;
      font-weight: bold;
      color: ${resume.accentColor || '#3B82F6'};
      margin-bottom: 10px;
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
      color: ${resume.accentColor || '#3B82F6'};
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .item {
      margin-bottom: 15px;
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
      background: ${resume.accentColor || '#3B82F6'}20;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
    }
    .summary {
      font-size: 14px;
      line-height: 1.6;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${personalInfo.fullName || 'Your Name'}</div>
    <div class="contact-info">
      ${personalInfo.email ? `${personalInfo.email} | ` : ''}
      ${personalInfo.phone ? `${personalInfo.phone} | ` : ''}
      ${personalInfo.location ? personalInfo.location : ''}
      ${personalInfo.linkedin ? `<br/>LinkedIn: ${personalInfo.linkedin}` : ''}
      ${personalInfo.website ? `<br/>Website: ${personalInfo.website}` : ''}
    </div>
  </div>

  ${resume.professionSummary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${resume.professionSummary}</div>
  </div>
  ` : ''}

  ${experience.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${experience.map(exp => `
      <div class="item">
        <div class="item-title">${exp.position || 'Position'}</div>
        <div class="item-subtitle">${exp.company || 'Company'} | ${exp.startDate || ''} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}</div>
        <div class="item-description">${exp.description || ''}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${projects.length > 0 ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projects.map(project => `
      <div class="item">
        <div class="item-title">${project.name || 'Project Name'}</div>
        <div class="item-subtitle">${project.type || 'Project Type'}</div>
        <div class="item-description">${project.description || ''}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${education.map(edu => `
      <div class="item">
        <div class="item-title">${edu.degree || 'Degree'}</div>
        <div class="item-subtitle">${edu.institution || 'Institution'} | ${edu.field || 'Field'}</div>
        ${edu.gpa ? `<div class="item-subtitle">GPA: ${edu.gpa}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills">
      ${skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
    </div>
  </div>
  ` : ''}
  
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;
}

export default router;