const { Client } = require('ssh2');

const conn = new Client();
console.log('Sunucuya bağlanılıyor...');

conn.on('ready', () => {
  console.log('Bağlantı başarılı. WAHA Docker konteyneri başlatılıyor...');
  
  const cmd = 'docker run -it -d --name waha --restart unless-stopped -p 3000:3000 devlikeapro/waha';
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log('Konteyner başlatma işlemi tamamlandı. Çıkış kodu:', code);
      conn.end();
    }).on('data', (data) => {
      console.log('Çıktı: ' + data);
    }).stderr.on('data', (data) => {
      console.log('Hata Çıktısı: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Bağlantı Hatası:', err);
}).connect({
  host: '31.97.37.208',
  port: 22,
  username: 'root',
  password: 'Vd9ZF@-JnbmP6x/'
});
