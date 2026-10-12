#!/usr/bin/env node

/**
 * QUICK DEBUG TEST - Check what health endpoint returns
 */

async function test() {
  try {
    const response = await fetch('http://localhost:5000/health');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

test();
