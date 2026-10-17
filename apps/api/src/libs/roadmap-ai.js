// AI integration for roadmap personalization and resource generation
// Uses OpenRouter API (same as Resume Builder)
import { getFreeResourcesForTopics } from './roadmap-resources.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getApiKey = () => process.env.OPENROUTER_API_KEY?.trim();
const getModel = () => process.env.MODEL_NAME || 'openai/gpt-4o-mini';

export async function generateCustomRoadmap({ field, goals, skillLevel }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('AI roadmap generation is not configured. Set OPENROUTER_API_KEY in apps/api/.env.');
  }

  const prompt = `Create a practical learning roadmap for the field: ${field}\nLearner goals: ${goals}\nStarting level: ${skillLevel}.\n\nReturn only JSON in this shape: {"title":"...","description":"...","milestones":[{"title":"...","description":"...","order":1,"topics":["..."]}]}. Provide 5 to 8 ordered milestones with 3 to 7 concrete topics each. Keep prerequisites in order, adapt depth to the starting level, and include hands-on projects. Do not include URLs.`;
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://careerhub.com' },
    body: JSON.stringify({ model: getModel(), messages: [
      { role: 'system', content: 'You create accurate, structured career learning roadmaps. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ], temperature: 0.6, max_tokens: 3000 })
  });
  if (!response.ok) throw new Error(`Roadmap AI provider returned ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI provider returned an invalid roadmap');
  const roadmap = JSON.parse(match[0]);
  if (!Array.isArray(roadmap.milestones) || roadmap.milestones.length < 3 || roadmap.milestones.length > 10) {
    throw new Error('AI provider returned an invalid roadmap structure');
  }
  roadmap.title = String(roadmap.title || `${field} Roadmap`).slice(0, 120);
  roadmap.description = String(roadmap.description || `A personalized ${skillLevel} learning path for ${field}.`).slice(0, 500);
  roadmap.milestones = roadmap.milestones.map((milestone, index) => ({
    title: String(milestone.title || `Stage ${index + 1}`).slice(0, 160),
    description: String(milestone.description || '').slice(0, 500),
    order: index + 1,
    topics: Array.isArray(milestone.topics) ? milestone.topics.slice(0, 12).map((topic) => String(topic).slice(0, 200)) : []
  }));
  return roadmap;
}

function adaptRoadmapForLevel(template, skillLevel = 'beginner') {
  const level = ['beginner', 'intermediate', 'advanced'].includes(skillLevel) ? skillLevel : 'beginner';
  const guidance = {
    beginner: 'Start with guided practice and build confidence with the foundations.',
    intermediate: 'Use familiar topics as a quick review, then focus on applying them in a practical project.',
    advanced: 'Treat familiar topics as optional review and focus on production trade-offs, architecture, and performance.'
  }[level];

  return {
    ...template,
    milestones: template.milestones.map((milestone) => {
      const anchorTopic = milestone.topics?.at(level === 'advanced' ? -1 : 0) || milestone.title;
      const projectTopic = level === 'beginner'
        ? `Guided practice: ${milestone.title}`
        : level === 'intermediate'
          ? `Project practice applying ${anchorTopic}`
          : `Production project: apply ${anchorTopic} with architecture and performance trade-offs`;

      return {
        ...milestone,
        description: `${milestone.description}. ${guidance}`,
        topics: [...(milestone.topics || []), projectTopic]
      };
    })
  };
}

/**
 * Generate personalized roadmap based on template and user goals
 */
export async function generatePersonalizedRoadmap(template, skillLevel, userGoals) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return adaptRoadmapForLevel(template, skillLevel);
  }

  try {
    const prompt = `
You are an expert career counselor and learning path designer. 
Based on this ${template.title} roadmap template for ${skillLevel} level:

${JSON.stringify(template, null, 2)}

User goals: ${userGoals}

Personalize this roadmap by:
1. Adapt the roadmap to the learner's ${skillLevel} starting point: beginner learners need foundations and guided practice; intermediate learners should briefly review prerequisites then focus on applied projects and deeper concepts; advanced learners should skip fundamentals they likely know and focus on architecture, trade-offs, performance, and production-level projects.
2. Keep prerequisites in a sensible order and identify optional review topics so learners can move faster where they are already confident.
3. Add specific sub-topics relevant to the learner's goals without making the path unnecessarily long.
4. Suggest realistic time estimates for each milestone (in weeks) and highlight critical learning paths.
5. Add difficulty indicators to each topic and make the difficulty appropriate to the selected starting level.

Return JSON structure with milestones array. Each milestone should have:
- title
- description
- order
- topics (array of strings)
- estimatedWeeks (number)
- difficulty (string: easy/medium/hard)
- critical (boolean: if this is a critical milestone)

Only return the JSON, no other text.
`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careerhub.com',
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates structured JSON for learning roadmaps.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const personalized = JSON.parse(jsonMatch[0]);
      return personalized;
    }

    // Fallback to template if JSON parsing fails
    return adaptRoadmapForLevel(template, skillLevel);
  } catch (error) {
    console.error('Error generating personalized roadmap:', error);
    return adaptRoadmapForLevel(template, skillLevel);
  }
}

/**
 * Generate AI-suggested free learning resources for a topic
 */
export async function generateResources(topic, skillLevel) {
  const curatedResources = getFreeResourcesForTopics([topic]);
  const apiKey = getApiKey();

  if (!apiKey) {
    return curatedResources;
  }

  try {
    const prompt = `
Find high-quality FREE learning resources for "${topic}" at ${skillLevel} level.

Include resources from:
- GeeksforGeeks (with specific article URLs)
- YouTube video tutorials (with channel names and video URLs)
- Official documentation links
- Reputable blog posts
- Practice platforms (LeetCode, HackerRank, CodeSignal, etc.)
- Online courses (free ones like freeCodeCamp, Coursera free courses)

Return JSON with categorized resources:
{
  "articles": [
    {
      "title": "Article title",
      "url": "https://...",
      "source": "GeeksforGeeks / MDN / etc",
      "description": "Brief description"
    }
  ],
  "videos": [
    {
      "title": "Video title",
      "url": "https://youtube.com/...",
      "channel": "Channel name",
      "duration": "X:XX",
      "description": "Brief description"
    }
  ],
  "practice": [
    {
      "title": "Practice platform / challenge",
      "url": "https://...",
      "description": "Brief description"
    }
  ],
  "courses": [
    {
      "title": "Course name",
      "url": "https://...",
      "platform": "freeCodeCamp / Coursera / etc",
      "description": "Brief description"
    }
  ]
}

Only return the JSON, no other text. Make URLs as specific and real as possible.
`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careerhub.com',
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that finds learning resources and returns structured JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const suggestedResources = JSON.parse(jsonMatch[0]);
      const resourceTypes = ['articles', 'videos', 'practice', 'courses'];

      return Object.fromEntries(resourceTypes.map((type) => {
        const curated = curatedResources[type] || [];
        const suggested = (Array.isArray(suggestedResources[type]) ? suggestedResources[type] : [])
          .filter((resource) => typeof resource.url === 'string' && resource.url.startsWith('https://'))
          .map((resource) => ({ ...resource, free: false, aiSuggested: true }));
        const unique = new Set(curated.map((resource) => resource.url));
        return [type, [...curated, ...suggested.filter((resource) => !unique.has(resource.url))].slice(0, 5)];
      }));
    }

    return curatedResources;
  } catch (error) {
    console.error('Error generating resources:', error);
    return curatedResources;
  }
}

/**
 * Generate AI suggestions for customizing an existing roadmap
 */
export async function customizeRoadmap(roadmap, userGoals) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return roadmap;
  }

  try {
    const prompt = `
User has this roadmap: ${roadmap.title}
Current milestones: ${JSON.stringify(roadmap.milestones, null, 2)}

User goals: ${userGoals}

Suggest customizations by:
1. Adding missing topics relevant to user goals
2. Removing less relevant topics
3. Reordering milestones for better flow
4. Adding specific project ideas related to user goals

Return updated milestones array in JSON format only.
`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careerhub.com',
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that customizes learning roadmaps.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const customized = JSON.parse(jsonMatch[0]);
      return { ...roadmap, milestones: customized };
    }

    return roadmap;
  } catch (error) {
    console.error('Error customizing roadmap:', error);
    return roadmap;
  }
}
