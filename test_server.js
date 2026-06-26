const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    console.log('--- REQUEST ---');
    console.log(JSON.stringify(JSON.parse(body), null, 2));
    res.end('{}');
    process.exit(0);
  });
}).listen(9999, () => console.log('listening'));
