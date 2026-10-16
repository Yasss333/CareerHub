// AI integration for roadmap personalization and resource generation
// Uses OpenRouter API (same as Resume Builder)

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Generate personalized roadmap based on template and user goals
 */
export async function generatePersonalizedRoadmap(template, skillLevel, userGoals) {
  if (!OPENROUTER_API_KEY) {
    // Return template as-is if no API key
    return template;
  }

  try {
    const prompt = `
You are an expert career counselor and learning path designer. 
Based on this ${template.title} roadmap template for ${skillLevel} level:

${JSON.stringify(template, null, 2)}

User goals: ${userGoals}

Personalize this roadmap by:
1. Adjusting milestone order based on ${skillLevel} level (${skillLevel === 'beginner' ? 'start with fundamentals' : skillLevel === 'intermediate' ? 'focus on advanced topics' : 'mastery level'})
2. Adding specific sub-topics relevant to user goals
3. Suggesting realistic time estimates for each milestone (in weeks)
4. Highlighting critical learning paths
5. Adding difficulty indicators to each topic

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
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careerhub.com',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
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
    return template;
  } catch (error) {
    console.error('Error generating personalized roadmap:', error);
    return template; // Fallback to original template
  }
}

/**
 * Generate AI-suggested free learning resources for a topic
 */
export async function generateResources(topic, skillLevel) {
  if (!OPENROUTER_API_KEY) {
    // Return default curated resources if no API key
    return getDefaultResources(topic);
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
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careerhub.com',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
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

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const resources = JSON.parse(jsonMatch[0]);
      return resources;
    }

    // Fallback to default resources
    return getDefaultResources(topic);
  } catch (error) {
    console.error('Error generating resources:', error);
    return getDefaultResources(topic);
  }
}

/**
 * Default curated resources when AI is unavailable
 */
function getDefaultResources(topic) {
  return {
    articles: [
      {
        title: `${topic} - GeeksforGeeks`,
        url: `https://www.geeksforgeeks.org/${topic.toLowerCase().replace(/\s+/g, '-')}/`,
        source: 'GeeksforGeeks',
        description: 'Comprehensive tutorials and examples'
      },
      {
        title: `${topic} - MDN Web Docs`,
        url: 'https://developer.mozilla.org/en-US/',
        source: 'MDN',
        description: 'Official documentation and guides'
      }
    ],
    videos: [
      {
        title: `${topic} Tutorial`,
        url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(topic + ' tutorial'),
        channel: 'YouTube Search',
        duration: 'Various',
        description: 'Search YouTube for tutorial videos'
      }
    ],
    practice: [
      {
        title: 'LeetCode Practice',
        url: 'https://leetcode.com/',
        description: 'Practice coding problems'
      },
      {
        title: 'HackerRank',
        url: 'https://www.hackerrank.com/',
        description: 'Coding challenges and competitions'
      }
    ],
    courses: [
      {
        title: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/',
        platform: 'freeCodeCamp',
        description: 'Free coding certifications'
      }
    ]
  };
}

/**
 * Generate AI suggestions for customizing an existing roadmap
 */
export async function customizeRoadmap(roadmap, userGoals) {
  if (!OPENROUTER_API_KEY) {
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
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careerhub.com',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
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
