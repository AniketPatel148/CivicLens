import OpenAI from 'openai';

const VALID_ISSUE_TYPES = ['pothole', 'trash', 'graffiti', 'streetlight', 'other'];

// Alias mapping for common variations
const ISSUE_TYPE_ALIASES = {
  'road_damage': 'pothole',
  'road damage': 'pothole',
  'crack': 'pothole',
  'litter': 'trash',
  'garbage': 'trash',
  'rubbish': 'trash',
  'dumping': 'trash',
  'vandalism': 'graffiti',
  'spray_paint': 'graffiti',
  'tagging': 'graffiti',
  'broken_light': 'streetlight',
  'light': 'streetlight',
  'lamp': 'streetlight',
  'street_light': 'streetlight'
};

const normalizeIssueType = (rawType) => {
  if (!rawType) return 'other';
  const normalized = rawType.toLowerCase().trim();
  if (ISSUE_TYPE_ALIASES[normalized]) return ISSUE_TYPE_ALIASES[normalized];
  if (VALID_ISSUE_TYPES.includes(normalized)) return normalized;
  return 'other';
};

const FALLBACK_CLASSIFICATION = {
  issueType: 'other',
  confidence: 0,
  classificationFailed: true
};

export const classifyImage = async (imageBase64) => {
  // Check if Featherless is configured
  if (!process.env.FEATHERLESS_API_KEY || !process.env.FEATHERLESS_BASE_URL) {
    console.warn('⚠️ Featherless not configured, using fallback');
    return FALLBACK_CLASSIFICATION;
  }

  const client = new OpenAI({
    apiKey: process.env.FEATHERLESS_API_KEY,
    baseURL: process.env.FEATHERLESS_BASE_URL
  });

  try {
    const response = await client.chat.completions.create({
      model: process.env.FEATHERLESS_MODEL || 'llava-1.5-7b-hf',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Classify this image into exactly ONE of these categories:
- pothole (road damage, cracks, holes in pavement)
- trash (litter, overflowing bins, illegal dumping)
- graffiti (spray paint, vandalism, tagging)
- streetlight (broken/flickering lights, damaged poles)
- other (none of the above)

Respond with JSON only: {"issueType": "<category>", "confidence": <0.0-1.0>}`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 100
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Featherless: No JSON in response:', content);
      return FALLBACK_CLASSIFICATION;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      issueType: normalizeIssueType(parsed.issueType),
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      classificationFailed: false
    };
  } catch (error) {
    console.error('Featherless classification error:', error.message);
    return FALLBACK_CLASSIFICATION;
  }
};

export default { classifyImage };
