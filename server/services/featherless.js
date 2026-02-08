import OpenAI from 'openai';

const VALID_ISSUE_TYPES = ['pothole', 'trash', 'graffiti', 'streetlight', 'other'];

// Alias mapping for common variations
const ISSUE_TYPE_ALIASES = {
  'road_damage': 'pothole',
  'road damage': 'pothole',
  'crack': 'pothole',
  'pavement': 'pothole',
  'asphalt': 'pothole',
  'hole': 'pothole',
  'litter': 'trash',
  'garbage': 'trash',
  'rubbish': 'trash',
  'dumping': 'trash',
  'waste': 'trash',
  'debris': 'trash',
  'vandalism': 'graffiti',
  'spray_paint': 'graffiti',
  'tagging': 'graffiti',
  'mural': 'graffiti',
  'broken_light': 'streetlight',
  'light': 'streetlight',
  'lamp': 'streetlight',
  'street_light': 'streetlight',
  'lighting': 'streetlight'
};

const normalizeIssueType = (rawType) => {
  if (!rawType) return 'other';
  const normalized = rawType.toLowerCase().trim();
  if (ISSUE_TYPE_ALIASES[normalized]) return ISSUE_TYPE_ALIASES[normalized];
  if (VALID_ISSUE_TYPES.includes(normalized)) return normalized;
  // Check for partial matches
  for (const [alias, type] of Object.entries(ISSUE_TYPE_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return type;
    }
  }
  return 'other';
};

const FALLBACK_CLASSIFICATION = {
  issueType: 'other',
  confidence: 0,
  classificationFailed: true
};

// Improved prompt with clearer instructions
const CLASSIFICATION_PROMPT = `You are an expert at identifying municipal infrastructure issues from photos.

Look at this image and classify it into ONE of these categories:

POTHOLE - Any road damage including:
- Holes in asphalt or concrete roads
- Cracked pavement
- Damaged sidewalks
- Broken curbs

TRASH - Waste and litter including:
- Overflowing garbage bins
- Litter on streets/sidewalks
- Illegal dumping
- Debris piles

GRAFFITI - Unauthorized markings including:
- Spray paint on walls/surfaces
- Tags and vandalism
- Defacement of property

STREETLIGHT - Lighting issues including:
- Broken or non-working street lights
- Damaged light poles
- Flickering lights
- Missing light covers

OTHER - Use ONLY if image clearly doesn't fit above categories

IMPORTANT: 
- Look carefully at the actual image content
- If you see road/pavement with damage, classify as "pothole"
- If you see garbage/litter, classify as "trash"
- Be confident in your classification

Respond with ONLY this JSON format:
{"issueType": "<pothole|trash|graffiti|streetlight|other>", "confidence": <0.0-1.0>}`;

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
      model: process.env.FEATHERLESS_MODEL || 'Qwen/Qwen3-VL-30B-A3B-Instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: CLASSIFICATION_PROMPT
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
      max_tokens: 150
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('🔍 Featherless raw response:', content);
    
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Featherless: No JSON in response:', content);
      return FALLBACK_CLASSIFICATION;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const issueType = normalizeIssueType(parsed.issueType);
    
    console.log('🔍 Normalized issue type:', issueType);
    
    return {
      issueType,
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.5)),
      classificationFailed: false
    };
  } catch (error) {
    console.error('Featherless classification error:', error.message);
    return FALLBACK_CLASSIFICATION;
  }
};

export default { classifyImage };
