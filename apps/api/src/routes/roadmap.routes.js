import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import roadmapTemplates from '../templates/roadmap-templates.js';
import { generatePersonalizedRoadmap, generateResources, customizeRoadmap, generateCustomRoadmap } from '../libs/roadmap-ai.js';
import { getFreeResourcesForTopics } from '../libs/roadmap-resources.js';
import { recordActivityStreak } from '../services/activity-streak.service.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

const hasResourceEntries = (resources) => {
  if (Array.isArray(resources)) return resources.length > 0;
  if (!resources || typeof resources !== 'object') return false;
  return Object.values(resources).some((items) => Array.isArray(items) && items.length > 0);
};

const withMilestoneResources = (roadmap) => ({
  ...roadmap,
  milestones: roadmap.milestones.map((milestone) => ({
    ...milestone,
    resources: hasResourceEntries(milestone.resources)
      ? milestone.resources
      : getFreeResourcesForTopics(milestone.topics?.length ? milestone.topics : [milestone.title])
  }))
});

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

// ============================================
// TEMPLATES (Public - No Auth Required)
// ============================================

// Get available templates
router.get('/templates', async (req, res) => {
  try {
    const templates = Object.keys(roadmapTemplates).map((key) => ({
      key,
      title: roadmapTemplates[key].title,
      description: roadmapTemplates[key].description,
      milestoneCount: roadmapTemplates[key].milestones.length
    }));

    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get specific template
router.get('/templates/:roleType', async (req, res) => {
  try {
    const template = roadmapTemplates[req.params.roleType.toLowerCase()];
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// ============================================
// ROADMAP CRUD
// ============================================

// Get all roadmaps for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: req.user.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, roadmaps: roadmaps.map(withMilestoneResources) });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

// Get specific roadmap
router.get('/:id', authenticate, async (req, res) => {
  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.userId !== req.user.id && !roadmap.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, roadmap: withMilestoneResources(roadmap) });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});

// Create new roadmap
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, roleType, skillLevel, topics, resources, isPublic } = req.body;

    if (!title || !roleType) {
      return res.status(400).json({ error: 'Title and role type are required' });
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: req.user.id,
        title,
        description: description || '',
        roleType,
        skillLevel: skillLevel || 'beginner',
        topics: topics || {},
        resources: resources || [],
        isPublic: isPublic || false,
        progress: 0
      }
    });
    await recordActivityStreak(prisma, req.user.id);

    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    res.status(500).json({ error: 'Failed to create roadmap' });
  }
});

// Update roadmap
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, skillLevel, topics, isPublic, status } = req.body;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.roadmap.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(skillLevel && { skillLevel }),
        ...(topics && { topics }),
        ...(isPublic !== undefined && { isPublic }),
        ...(status && { status })
      }
    });

    res.json({ success: true, roadmap: updated });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    res.status(500).json({ error: 'Failed to update roadmap' });
  }
});

// Delete roadmap
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.roadmap.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ error: 'Failed to delete roadmap' });
  }
});

// ============================================
// MILESTONE MANAGEMENT
// ============================================

// Add milestone
router.post('/:id/milestones', authenticate, async (req, res) => {
  try {
    const { title, description, order, topics, resources, dueDate } = req.body;

    if (!title || !order) {
      return res.status(400).json({ error: 'Title and order are required' });
    }

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const milestone = await prisma.roadmapMilestone.create({
      data: {
        roadmapId: req.params.id,
        title,
        description: description || '',
        order,
        topics: topics || [],
        resources: resources || [],
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    // Update roadmap progress
    await updateRoadmapProgress(req.params.id);
    if (!milestone.isCompleted) await recordActivityStreak(prisma, req.user.id);

    res.status(201).json({ success: true, milestone });
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
});

// Update milestone
router.put('/:id/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const { title, description, order, topics, dueDate } = req.body;

    const milestone = await prisma.roadmapMilestone.findUnique({
      where: { id: req.params.milestoneId }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: milestone.roadmapId }
    });

    if (!roadmap || roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.roadmapMilestone.update({
      where: { id: req.params.milestoneId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(order && { order }),
        ...(topics && { topics }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
      }
    });

    res.json({ success: true, milestone: updated });
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Delete milestone
router.delete('/:id/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const milestone = await prisma.roadmapMilestone.findUnique({
      where: { id: req.params.milestoneId }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: milestone.roadmapId }
    });

    if (!roadmap || roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.roadmapMilestone.delete({
      where: { id: req.params.milestoneId }
    });

    // Update roadmap progress
    await updateRoadmapProgress(req.params.id);

    res.json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

// Mark milestone complete
router.put('/:id/milestones/:milestoneId/complete', authenticate, async (req, res) => {
  try {
    const milestone = await prisma.roadmapMilestone.findUnique({
      where: { id: req.params.milestoneId }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: milestone.roadmapId }
    });

    if (!roadmap || roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.roadmapMilestone.update({
      where: { id: req.params.milestoneId },
      data: {
        isCompleted: !milestone.isCompleted,
        completedAt: milestone.isCompleted ? null : new Date()
      }
    });

    // Update roadmap progress
    await updateRoadmapProgress(req.params.id);
    if (!milestone.isCompleted) await recordActivityStreak(prisma, req.user.id);

    res.json({ success: true, milestone: updated });
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// ============================================
// AI GENERATION
// ============================================

// Generate roadmap from template with AI personalization
router.post('/generate-custom', authenticate, async (req, res) => {
  try {
    const field = typeof req.body.field === 'string' ? req.body.field.trim().slice(0, 120) : '';
    const goals = typeof req.body.goals === 'string' ? req.body.goals.trim().slice(0, 1200) : '';
    const skillLevel = ['beginner', 'intermediate', 'advanced'].includes(req.body.skillLevel) ? req.body.skillLevel : 'beginner';
    if (!field || !goals) return res.status(400).json({ error: 'Field and learning goals are required' });

    const personalized = await generateCustomRoadmap({ field, goals, skillLevel });
    const roadmap = await prisma.roadmap.create({ data: {
      userId: req.user.id,
      title: personalized.title,
      description: personalized.description,
      roleType: 'custom',
      skillLevel,
      topics: personalized,
      resources: [],
      progress: 0
    } });
    await recordActivityStreak(prisma, req.user.id);
    for (const milestone of personalized.milestones) {
      await prisma.roadmapMilestone.create({ data: {
        roadmapId: roadmap.id,
        title: milestone.title,
        description: milestone.description,
        order: milestone.order,
        topics: milestone.topics,
        resources: getFreeResourcesForTopics(milestone.topics.length ? milestone.topics : [milestone.title])
      } });
    }
    const createdRoadmap = await prisma.roadmap.findUnique({ where: { id: roadmap.id }, include: { milestones: { orderBy: { order: 'asc' } } } });
    return res.status(201).json({ success: true, roadmap: createdRoadmap });
  } catch (error) {
    console.error('Error generating custom roadmap:', error);
    const notConfigured = error.message?.includes('not configured');
    return res.status(notConfigured ? 503 : 502).json({ error: notConfigured ? error.message : 'Could not generate a custom roadmap. Please try again.' });
  }
});

router.post('/generate', authenticate, async (req, res) => {
  try {
    const { roleType, skillLevel, userGoals } = req.body;

    if (!roleType) {
      return res.status(400).json({ error: 'Role type is required' });
    }

    const template = roadmapTemplates[roleType.toLowerCase()];
    if (!template) {
      return res.status(400).json({ error: 'Invalid role type' });
    }

    // Generate personalized roadmap
    const personalized = await generatePersonalizedRoadmap(template, skillLevel, userGoals);

    // Create roadmap in database
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: req.user.id,
        title: personalized.title,
        description: personalized.description,
        roleType,
        skillLevel: skillLevel || 'beginner',
        topics: personalized,
        resources: personalized.resources || [],
        progress: 0
      }
    });
    await recordActivityStreak(prisma, req.user.id);

    // Create milestones from template
    for (const milestone of personalized.milestones) {
      await prisma.roadmapMilestone.create({
        data: {
          roadmapId: roadmap.id,
          title: milestone.title,
          description: milestone.description || '',
          order: milestone.order,
          topics: milestone.topics || [],
          resources: hasResourceEntries(milestone.resources)
            ? milestone.resources
            : getFreeResourcesForTopics(milestone.topics?.length ? milestone.topics : [milestone.title])
        }
      });
    }

    // Fetch created roadmap with milestones
    const createdRoadmap = await prisma.roadmap.findUnique({
      where: { id: roadmap.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json({ success: true, roadmap: createdRoadmap });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

// Generate AI resources for a topic
router.post('/:id/resources', authenticate, async (req, res) => {
  try {
    const { topic, milestoneId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (milestoneId) {
      const milestone = await prisma.roadmapMilestone.findFirst({
        where: { id: milestoneId, roadmapId: roadmap.id }
      });

      if (!milestone) {
        return res.status(404).json({ error: 'Roadmap milestone not found' });
      }

      const resourceTopics = [milestone.title, ...(Array.isArray(milestone.topics) ? milestone.topics : [])];
      const resources = await generateResources(resourceTopics.join(', ') || topic, roadmap.skillLevel);

      await prisma.roadmapMilestone.update({
        where: { id: milestoneId },
        data: { resources }
      });

      return res.json({ success: true, resources });
    } else {
      const resources = await generateResources(topic, roadmap.skillLevel);
      await prisma.roadmap.update({
        where: { id: req.params.id },
        data: { resources }
      });

      return res.json({ success: true, resources });
    }
  } catch (error) {
    console.error('Error generating resources:', error);
    res.status(500).json({ error: 'Failed to generate resources' });
  }
});

// Customize existing roadmap with AI
router.post('/:id/customize', authenticate, async (req, res) => {
  try {
    const { userGoals } = req.body;

    if (!userGoals) {
      return res.status(400).json({ error: 'User goals are required' });
    }

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customized = await customizeRoadmap(roadmap, userGoals);

    // Update milestones with AI suggestions
    if (customized.milestones) {
      // Delete existing milestones
      await prisma.roadmapMilestone.deleteMany({
        where: { roadmapId: req.params.id }
      });

      // Create new milestones
      for (const milestone of customized.milestones) {
        await prisma.roadmapMilestone.create({
          data: {
            roadmapId: req.params.id,
            title: milestone.title,
            description: milestone.description || '',
            order: milestone.order,
            topics: milestone.topics || [],
            resources: milestone.resources || []
          }
        });
      }
    }

    // Update roadmap
    const updated = await prisma.roadmap.update({
      where: { id: req.params.id },
      data: { topics: customized }
    });

    // Fetch updated roadmap
    const finalRoadmap = await prisma.roadmap.findUnique({
      where: { id: req.params.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json({ success: true, roadmap: finalRoadmap });
  } catch (error) {
    console.error('Error customizing roadmap:', error);
    res.status(500).json({ error: 'Failed to customize roadmap' });
  }
});

// Helper function to update roadmap progress
async function updateRoadmapProgress(roadmapId) {
  const milestones = await prisma.roadmapMilestone.findMany({
    where: { roadmapId }
  });

  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalCount = milestones.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  await prisma.roadmap.update({
    where: { id: roadmapId },
    data: { progress }
  });
}

export default router;
