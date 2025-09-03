// Test script for real agriculture data API
const fetch = require('node-fetch');

async function testAgricultureAPI() {
  try {
    console.log('🧪 Testing agriculture data API...');
    
    const response = await fetch('http://localhost:5002/api/agriculture/real-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAgricultureAPI();
