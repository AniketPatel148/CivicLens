import axios from 'axios';

const FALLBACK_ENRICHMENT = {
  summary: 'Thank you for your report. Our team will review this issue and route it to the appropriate department.',
  severity: 3,
  department: 'general',
  reason: 'Automatic classification unavailable. Report queued for manual review.',
  enrichmentFailed: true
};

const buildPrompt = (userDescription) => `
You are an AI assistant for a city's neighborhood issue reporting system.

CONTEXT:
- A resident submitted a photo of a local issue
- User's description (if any): "${userDescription || 'None provided'}"

TASK:
Analyze the image and provide a JSON response with exactly these fields:

{
  "issueType": "<one of: pothole, trash, graffiti, streetlight, other>",
  "confidence": <0.0-1.0>,
  "summary": "<1-2 sentence description for residents. Be specific about what you see, location details in the image, and potential impact. Use plain language.>",
  "severity": <1-5 integer>,
  "department": "<one of: public_works, sanitation, parks, utilities, police_non_emergency, general>",
  "reason": "<1 sentence explaining why this department should handle it>"
}

ISSUE TYPE CLASSIFICATION:
- pothole: road damage, cracks, holes in pavement, sidewalk damage
- trash: garbage, litter, overflowing bins, illegal dumping
- graffiti: spray paint, vandalism, tags on walls/surfaces
- streetlight: broken lights, damaged poles, dark areas
- other: none of the above

SEVERITY SCALE:
1 = Minor cosmetic issue, no safety concern
2 = Nuisance but not urgent
3 = Should be addressed within a week
4 = Potential safety hazard, needs attention soon
5 = Immediate danger to public safety

DEPARTMENT ROUTING:
- public_works: roads, sidewalks, potholes, streetlights, traffic signals
- sanitation: trash, illegal dumping, overflowing bins
- parks: park damage, fallen trees, playground issues
- utilities: water leaks, exposed wiring, manhole covers
- police_non_emergency: graffiti, vandalism, abandoned vehicles
- general: unclear or multiple departments needed

RULES:
- Look at the image carefully and classify based on what you actually see
- Keep summary under 50 words
- Be helpful and empathetic in tone

Respond with ONLY valid JSON, no markdown formatting.
`;

const VALID_DEPARTMENTS = ['public_works', 'sanitation', 'parks', 'utilities', 'police_non_emergency', 'general'];
const VALID_ISSUE_TYPES = ['pothole', 'trash', 'graffiti', 'streetlight', 'other'];

export const enrichReport = async (imageBase64, description) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ Gemini not configured, using fallback');
    return FALLBACK_ENRICHMENT;
  }

  try {
    // Extract base64 data and mime type
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error('Gemini: Invalid base64 format');
      return FALLBACK_ENRICHMENT;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Use REST API directly with v1beta for gemini-3-flash-preview
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            },
            {
              text: buildPrompt(description)
            }
          ]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error('Gemini: No text in response');
      return FALLBACK_ENRICHMENT;
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Gemini: No JSON in response:', responseText);
      return FALLBACK_ENRICHMENT;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and sanitize response
    return {
      issueType: VALID_ISSUE_TYPES.includes(parsed.issueType) ? parsed.issueType : 'other',
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.8)),
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 500) : FALLBACK_ENRICHMENT.summary,
      severity: Math.min(5, Math.max(1, parseInt(parsed.severity) || 3)),
      department: VALID_DEPARTMENTS.includes(parsed.department) ? parsed.department : 'general',
      reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : '',
      enrichmentFailed: false
    };
  } catch (error) {
    console.error('Gemini enrichment error:', error.response?.data?.error?.message || error.message);
    return FALLBACK_ENRICHMENT;
  }
};

export default { enrichReport };
