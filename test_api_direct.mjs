#!/usr/bin/env node
/**
 * Direct API test for NoorStudio
 * Tests the AI endpoints directly to identify any timeout issues
 */

const API_BASE = 'http://localhost:3002';

async function testAITextEndpoint() {
  console.log('\n=== Testing AI Text Endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'outline',
        prompt: 'Generate a simple outline for a children\'s book about honesty.',
        projectId: 'test-project-1'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error testing text endpoint:', error.message);
    return null;
  }
}

async function testAIImageEndpoint() {
  console.log('\n=== Testing AI Image Endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'illustrations',
        prompt: 'A cute Muslim child character with big eyes',
        projectId: 'test-project-1'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error testing image endpoint:', error.message);
    return null;
  }
}

async function testHealthEndpoint() {
  console.log('\n=== Testing Health Endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log('Health check:', data);
    return data;
  } catch (error) {
    console.error('Error testing health endpoint:', error.message);
    return null;
  }
}

async function main() {
  console.log('NoorStudio API Direct Test');
  console.log('===========================\n');
  
  // Test health endpoint first
  await testHealthEndpoint();
  
  // Test text generation (should work with mock provider)
  await testAITextEndpoint();
  
  // Test image generation
  await testAIImageEndpoint();
  
  console.log('\n=== Test Complete ===\n');
}

main().catch(console.error);
