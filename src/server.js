const WebSocket = require('ws');
const publicIp = require('public-ip');
const uuidv3 = require('uuid/v3');
const redis = require("redis");
const config = require('./config');

const sub = redis.createClient(config.DB.REDIS_PORT, config.DB.REDIS_HOST);
const pub = redis.createClient(config.DB.REDIS_PORT, config.DB.REDIS_HOST);

if (config.DB.REDIS_PASSWORD) {
  sub.auth(config.DB.REDIS_PASSWORD);
	pub.auth(config.DB.REDIS_PASSWORD);
}

const wss = new WebSocket.Server({ port: 2333 });

const ip2name = {
  '47.94.233.234': '梁王的高配据点',
  '115.28.68.89': '梁王的9块服务器',
}

let sockets = {};

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws) {
  const uuid = uuidv3('lwio.me', uuidv3.DNS);
  ws.uuid = uuid;
  sockets[uuid] = ws;
  ws.on('message', function incoming(message) {
    pub.publish('channel', `${ws.uuid}>${message}`);
    console.log('publish `${ws.uuid}>${message}`')
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(`来自${ws.from || '???'}的用户${ws.uuid}发送了: ${message}`);
      }
    });
  });

  publicIp.v4().then(ip => {
    console.log(ip);
    ws.from = ip2name[ip] ? ip2name[ip] : '未知';
    ws.send(`你连接的服务器为${ws.from}`);
  });
});


// 监听其他服务器发送的消息
sub.on('message', function(channel, message) {
  console.log(`channel ${channel}, ${message}`)
	if (channel == 'channel')
	{
		var messageArr = message.split('>');
		var ws = sockets[messageArr[0]];
		var content = messageArr[1];
		// les messages sont supposés contenir les ID utilisateurs
		//var socket = sockets[message];
		if (ws != undefined)
		{
      ws.send(`来自${ws.from || '???'}的用户${ws.uuid}发送了: ${content}(来自与你另一台服务器)`);
		}
	}
});

sub.subscribe('channel');