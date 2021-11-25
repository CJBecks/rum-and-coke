// local tunnel
const localtunnel = require('localtunnel');

module.exports = function (port, ip, subdomain) {
    (async () => {
        const tunnel = await localtunnel({ port: port, local_host: ip, subdomain: subdomain, https: false });
    
        // the assigned public url for your tunnel
        // i.e. https://abcdefgjhij.localtunnel.me
        tunnel.url;
    
        console.log('URL: ', tunnel.url);
    
        tunnel.on('open', () => {
            // tunnels are closed
            console.log('Open');
        });
    
        tunnel.on('close', () => {
            // tunnels are closed
            console.log('close');
        });
    })();
}