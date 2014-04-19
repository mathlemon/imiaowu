var express = require('express');
var wechat = require('wechat');
var config = require('./config');

var app = express();
var ipaddr = process.env.OPENSHIFT_INTERNAL_IP;
var port = parseInt(process.env.OPENSHIFT_INTERNAL_PORT) || 8080;

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});




app.use('/wechat', wechat(config.token, wechat.text(function (message, req, res) {
  console.log(message);
  var input = (message.Content || '').trim();

  if (input === '大王') {
    return res.reply("不要叫我大王，要叫我女王大人啊……");
  }
  if (input.length < 2) {
    return res.reply('内容太少，请多输入一点:)');
  }
  var data = alpha.search(input);
  var content = '';
  switch (data.status) {
  case 'TOO_MATCHED':
    content = '找到API过多，请精确一点：\n' + data.result.join(', ').substring(0, 100) + '...';
    break;
  case 'MATCHED':
    content = data.result.map(function (item) {
      var replaced = (item.desc || '')
        .replace(/<p>/ig, '').replace(/<\/p>/ig, '')
        .replace(/<code>/ig, '').replace(/<\/code>/ig, '')
        .replace(/<pre>/ig, '').replace(/<\/pre>/ig, '')
        .replace(/<strong>/ig, '').replace(/<\/strong>/ig, '')
        .replace(/<ul>/ig, '').replace(/<\/ul>/ig, '')
        .replace(/<li>/ig, '').replace(/<\/li>/ig, '')
        .replace(/<em>/ig, '').replace(/<\/em>/ig, '')
        .replace(/&#39;/ig, "'");

      return {
        title: item.path,
        description: item.textRaw + ':\n' + replaced,
        picurl: config.domain + '/assets/qrcode.jpg',
        url: config.domain + '/detail?id=' + item.hash
      };
    });
    if (data.more && data.more.length) {
      content.push({
        title: '更多：' + data.more.join(', ').substring(0, 200) + '...',
        description: data.more.join(', ').substring(0, 200) + '...',
        picurl: config.domain + '/assets/qrcode.jpg',
        url: config.domain + '/404'
      });
    }
    break;
  default:
    res.wait('view');
    return;
    break;
  }
  var from = message.FromUserName;
  if (!Array.isArray(content)) {
    if (from === 'oPKu7jgOibOA-De4u8J2RuNKpZRw') {
      content = '主人你好：\n' + content;
    }
    if (from === 'oPKu7jpSY1tD1xoyXtECiM3VXzdU') {
      content = '女王大人:\n' + content;
    }
  }
  console.log(content);
  res.reply(content);
}).image(function (message, req, res) {
  console.log(message);
  res.reply('还没想好图片怎么处理啦。');
}).location(function (message, req, res) {
  console.log(message);
  res.reply('想和我约会吗，不要的啦。');
}).voice(function (message, req, res) {
  console.log(message);
  res.reply('心情不好，不想搭理你。');
}).event(function (message, req, res) {
  console.log(message);
  if (message.Event === 'subscribe') {
    // 用户添加时候的消息
    res.reply('谢谢添加Node.js公共帐号:)\n回复Node.js API相关关键词，将会得到相关描述。如：module, setTimeout等');
  } else if (message.Event === 'unsubscribe') {
    res.reply('Bye!');
  } else {
    res.reply('暂未支持! Coming soon!');
  }
})));

// respond
app.use(function(req, res, next){
  res.send('Hello World');
});

console.log("app started");
app.listen(port);
