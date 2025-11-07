// testMatchRequest.js

const fetch = require('node-fetch'); // we already installed node-fetch@2

async function testMatch() {
  // 1) Build the body we want to send to /api/match
  const body = {
    players: [
      { name: 'Tron731', platform: 'pc', team: 'blue' },
      // You can add more players here if you want:
      // { name: 'FriendName', platform: 'pc', team: 'blue' },
      // { name: 'EnemyName', platform: 'pc', team: 'orange' },
    ],
  };

  try {
    // 2) Send POST request to our backend
    const response = await fetch('http://localhost:4000/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Status code:', response.status);

    const data = await response.json();
    console.log('Response JSON:\n', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error calling /api/match:', err);
  }
}

testMatch();
