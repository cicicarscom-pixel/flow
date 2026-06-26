const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Registering Webhook on WAHA...');
  
  const cmd = `curl -X POST http://localhost:3000/api/webhooks -H "accept: application/json" -H "X-Api-Key: workigom_key_2026" -H "Content-Type: application/json" -d '{ "url": "https://qybzidylewzsnmlofjul.supabase.co/functions/v1/waha-webhook", "events": ["message"]}'`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nDone:', code);
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
