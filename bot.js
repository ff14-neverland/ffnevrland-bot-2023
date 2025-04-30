import fs from 'fs';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import Wordpress from './lib/wordpress.js';
import QQ from './lib/qq.js';
import Common from './lib/common.js';

const configFile = fs.readFileSync('./config.json', 'utf-8');
const config = JSON.parse(configFile);

const app = new Koa();
app.use(bodyParser());
app.use(async ctx => {
  const qqMessage = ctx.request.body;
  console.log(ctx.request.body);
  if(qqMessage){
      const messageContent = ctx.request.body.raw_message;
      const command = QQ.readCommand(messageContent);
      const messageType = ctx.request.body.message_type;
      const userId = ctx.request.body.user_id;
      let senderId = userId;
      //如果發送者為群，將senderId設為group_id
      if(ctx.request.body.group_id){
          senderId = ctx.request.body.group_id;
      }
      switch(command){
      case 'help':
        _getHelp(senderId);
      break;


      case 'roll':
        _roll(senderId, messageContent);
      break;


      case 'choose':
        _choose(senderId, messageContent);
      break;
    }
  }else{
      ctx.body = 'Please provide QQ message.';
  }
});

console.log('Start at 2000 port.');
app.listen(2000);

async function _getHelp(senderId){
  let content = '目前指令：';
  content += '\n /roll (骰子數量)d(骰子面數) 擲骰功能。範例：1顆100面的骰子= 1d100';
  content += '\n /choose (選項) 睡鼠老師，幫我選擇！格式範例：選項1|選項2。建議小窗使用。';
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _roll(senderId, messageContent){
  const rollRegax = /(\/roll) ([0-9]+)d([0-9]+)/;
  console.log(messageContent);
  const diceNumber = parseInt(rollRegax.exec(messageContent)[2]);
  const rollNumber = parseInt(rollRegax.exec(messageContent)[3]);
  const rollResult = Common.rollDice(diceNumber, rollNumber).toString();
  const content = diceNumber + 'd' + rollNumber + '擲骰結果：' + rollResult;
  const result = await QQ.sendMessage(senderId, unescapeHtml(content), config);
  console.log(result);
}

async function _choose(senderId, messageContent){
  const chooseRegax = /^(\/choose) ([\s\S]*)$/;
  const optionsString = chooseRegax.exec(messageContent)[2];
  const options = optionsString.split('|');
  let content = '';
  if(options.length !== 0){
    const result = Common.choose(options);
    content = '隨機選擇結果：' + result;
  }else{
    content = '格式不符合！';
  }
  const result = await QQ.sendMessage(senderId, unescapeHtml(content), config);
  console.log(result);
}

function unescapeHtml(str){
  if (typeof str !== 'string') return str;

	var patterns = {
		'&lt;'   : '<',
		'&gt;'   : '>',
		'&amp;'  : '&',
		'&quot;' : '"',
		'&#x27;' : '\'',
		'&#x60;' : '`'
	};

	return str.replace(/&(lt|gt|amp|quot|#x27|#x60);/g, function(match) {
		return patterns[match];
	});
}