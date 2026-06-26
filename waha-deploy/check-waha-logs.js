const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Fetching WAHA Docker logs...');
  
  const cmd = `docker logs --tail 50 waha`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
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
