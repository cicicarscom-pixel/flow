const { Client } = require('ssh2');

const conn = new Client();
console.log('Sunucuya baÄŸlanÄ±lÄ±yor...');

conn.on('ready', () => {
  console.log('BaÄŸlantÄ± baÅŸarÄ±lÄ±. WAHA Docker konteyneri baÅŸlatÄ±lÄ±yor...');
  
  const cmd = 'docker run -it -d --name waha --restart unless-stopped -p 3000:3000 devlikeapro/waha';
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log('Konteyner baÅŸlatma iÅŸlemi tamamlandÄ±. Ã‡Ä±kÄ±ÅŸ kodu:', code);
      conn.end();
    }).on('data', (data) => {
      console.log('Ã‡Ä±ktÄ±: ' + data);
    }).stderr.on('data', (data) => {
      console.log('Hata Ã‡Ä±ktÄ±sÄ±: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH BaÄŸlantÄ± HatasÄ±:', err);
}).connect({
  host: '31.97.37.208',
  port: 22,
  username: 'root',
  password: process.env.SSH_PASSWORD
});

