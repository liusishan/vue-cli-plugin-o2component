const path = require('path');
var needle = require('needle');
const p = path.resolve(process.cwd(), './o2.config.js');
const config = require(p);
const server = config.server;

const host = `${(server.https) ? 'https' : 'http'}://${server.host}/${(!server.httpPort || server.httpPort==='80') ? '' : server.httpPort}`;
const proxy = {};
(config.components || []).concat(['o2_core', 'o2_lib', 'x_desktop', 'x_component_']).forEach((path)=>{
    proxy['^/'+path] = {target: host}
});

let before = function(app){
    app.get('/x_desktop/res/config/config.json', function(req, res) {
        const configUrl = new URL(req.url, host)
        needle.get(configUrl.toString(), function(error, response) {
            if (!error && response.statusCode === 200){
                let o2Config = response.body;
                o2Config.sessionStorageEnable = true;
                o2Config.applicationServer = {
                    "host": (config.appServer && config.appServer.host) ? config.appServer.host : server.host
                };
                o2Config.center = [{
                    "port": server.port,
                    "host": server.host
                }];
                res.json(o2Config);
            }else {
                res.send(res);
            }
        });
    });
}
module.exports = {
    before: before,
    proxy: proxy,
    open: true
}