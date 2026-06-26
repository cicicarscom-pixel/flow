const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Deploying WAHA PLUS with Webhook Env Vars...');
  
  const cmd = `docker stop waha; docker rm waha; docker run -it -d --name waha --restart unless-stopped -p 3000:3000 -e WAHA_API_KEY=workigom_key_2026 -e WAHA_DASHBOARD_USERNAME=admin -e WAHA_DASHBOARD_PASSWORD=workigom -e WAHA_WEBHOOK_URL=https://qybzidylewzsnmlofjul.supabase.co/functions/v1/waha-webhook -e WAHA_WEBHOOK_EVENTS=message devlikeapro/waha-plus`;
  
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
