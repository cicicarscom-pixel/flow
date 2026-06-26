const fs = require('fs');

async function sendTestMessage() {
  const payload = {
    session: "92a3d0e4-d4db-479b-99d9-a3ea02c29da8",
    chatId: "905076457908@c.us",
    text: "Merhaba! Ben Workigom asistanı, bağlantı testim başarılı. 🚀"
  };

  try {
    console.log('Sending message to WAHA...');
    const response = await fetch('http://31.97.37.208:3000/api/sendText', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'X-Api-Key': 'workigom_key_2026',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('Status Code:', response.status);
    console.log('Response:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

sendTestMessage();
