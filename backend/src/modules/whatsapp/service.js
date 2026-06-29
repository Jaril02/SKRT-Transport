const {Client,LocalAuth,MessageMedia} = require('whatsapp-web.js');
let client=null;
let isReady=false;
let qrCode=null;

exports.initialize =()=>{
    client = new Client({
        authStrategy: new LocalAuth({clientId:"skrt-whatsapp"}),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox', '--disable-setuid-sandbox',
            ]
        }
    });

    client.on('qr', (qr) => {
        qrCode=qr;
        console.log('Scan QR  with Whatsapp', qr);
    });

    client.on
}