const { Client } = require('ssh2');
const conn = new Client();

// Use process.env.DOCKER_PAT for security
const DOCKER_PAT = process.env.DOCKER_PAT || "YOUR_DOCKER_PAT_HERE";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "YOUR_WAHA_API_KEY_HERE";

conn.on('ready', () => {
  console.log('Deploying WAHA PLUS...');
  
  const cmd = `docker login -u devlikeapro -p ${DOCKER_PAT} && docker pull devlikeapro/waha-plus:latest && docker stop waha; docker rm waha; docker run -it -d --name waha --restart unless-stopped -p 3000:3000 -e WAHA_API_KEY=${WAHA_API_KEY} devlikeapro/waha-plus`;
  
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
