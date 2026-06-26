const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Recreating WAHA with API Key...');
  
  const cmd = 'docker rm -f waha && docker run -it -d --name waha --restart unless-stopped -e WHATSAPP_API_KEY=esnaf123 -p 3000:3000 devlikeapro/waha';
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Done:', code);
      conn.end();
    }).on('data', (data) => process.stdout.write(data))
      .stderr.on('data', (data) => process.stdout.write(data));
  });
}).connect({
  host: '31.97.37.208',
  port: 22,
  username: 'root',
  password: 'Vd9ZF@-JnbmP6x/'
});
