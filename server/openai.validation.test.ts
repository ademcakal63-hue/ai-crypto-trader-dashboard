/**
 * OpenAI API Key Validation Test
 * Tests if the provided OpenAI API Key is valid
 */

import { describe, it, expect } from 'vitest';

describe('OpenAI API Key Validation', () => {
  it('should have OPENAI_API_KEY environment variable set', () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(apiKey).toMatch(/^sk-proj-/);
  });

  it('should validate OpenAI API Key by calling models endpoint', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    // Call OpenAI API to validate the key
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if API key is valid
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    
    // Check if GPT-4o model is available
    const hasGpt4o = data.data.some((model: any) => 
      model.id.includes('gpt-4o')
    );
    
    expect(hasGpt4o).toBe(true);
    
    console.log('✅ OpenAI API Key is valid!');
    console.log(`✅ Found ${data.data.length} available models`);
    console.log('✅ GPT-4o model is available for fine-tuning');
  }, 30000); // 30 second timeout
});
