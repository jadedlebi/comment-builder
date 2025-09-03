const axios = require('axios');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateComment(rulemakingData, userData) {
    try {
      const prompt = this.buildPrompt(rulemakingData, userData);
      
      const response = await axios.post(this.baseURL, {
        model: this.model,
        max_tokens: 1500,
        messages: [
          { role: 'user', content: prompt }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000 // 30 second timeout
      });

      if (!response.data || !response.data.content || !response.data.content[0]) {
        throw new Error('Invalid response from Claude API');
      }

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate comment letter');
    }
  }

  buildPrompt(rulemakingData, userData) {
    const {
      agency,
      title,
      description,
      docket_id,
      legal_analysis,
      opposition_points
    } = rulemakingData;

    const {
      name,
      city,
      state,
      personal_story,
      why_it_matters,
      experiences,
      concerns
    } = userData;

    return `You are helping create a unique, personalized comment letter opposing the ${agency}'s proposed rule "${title}" (Docket No. ${docket_id}).

The user has provided:
- Name: ${name}
- Location: ${city ? city + ', ' : ''}${state || ''}
- Personal story: ${personal_story || 'Not provided'}
- Why this issue matters: ${why_it_matters || 'Not provided'}
- Financial service experiences: ${experiences || 'Not provided'}
- Concerns about the rule: ${concerns || 'Not provided'}

Background context (DO NOT quote or copy directly from any source):
${description || 'No description provided'}

Legal analysis context (DO NOT quote directly):
${legal_analysis || 'No legal analysis provided'}

Key opposition points (DO NOT quote directly):
${opposition_points ? JSON.stringify(opposition_points) : 'No specific opposition points provided'}

Write a completely original, authentic comment letter that:
- Sounds like it comes from this specific person, not a template
- Uses ONLY their own words and experiences as the foundation
- Explains the issue in their voice, using analogies or examples that fit their background
- Makes 1-3 points about why the rule change is problematic based on their stated concerns
- Connects to their community or personal situation
- Shows genuine concern rather than policy jargon
- Is 300-500 words
- Avoids any phrases that sound like they came from advocacy materials
- Uses conversational but respectful tone appropriate for government comment
- NEVER suggests policy alternatives or solutions - only expresses opposition to the proposed rule
- NEVER mentions facts, statistics, or claims not provided by the user
- Focuses on the user's perspective and concerns rather than broader policy arguments
- Includes proper formatting with clear paragraphs

The goal is a letter so personal and authentic that it clearly comes from a real person with genuine concerns, based solely on what they have shared with you.`;
  }

  async validateApiKey() {
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error) {
      console.error('Claude API validation failed:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = new ClaudeService();
