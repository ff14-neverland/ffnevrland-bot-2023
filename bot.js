import fs from 'fs';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import QQ from './lib/qq.js';
import Database from './lib/database.js';
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

      case 'at':
        _getChara(senderId, messageContent);
      break;

      case 'bag':
        _getBag(senderId, messageContent);
      break;

      case 'pf':
        _getFormula(senderId, messageContent);
      break;

      case 'roll':
        _roll(senderId, messageContent);
      break;

      case 'cj':
        _collect(senderId, messageContent);
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
  content += '\n /at (角色名稱) 输出角色技能组、随身携带宝可梦、道具';
  content += '\n /roll (骰子數量)d(骰子面數) 擲骰功能。範例：1顆100面的骰子= 1d100';
  content += '\n /choose (選項) 睡鼠老師，幫我選擇！格式範例：選項1|選項2。建議小窗使用。';
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _getChara(senderId, messageContent){
  const atRegax = /^(\/at) ([\s\S]*)$/;
  const name = atRegax.exec(messageContent)[2];
  const chara = await Database.fetchChara(name);
  let content = '';
  if(chara){
    content = '角色' + chara['name'] + '目前狀態：';
    if(chara['skill']){
      content += '\n技能组：' + chara['skill'];
    }
    if(chara['pokemon']){
      content += '\n寶可夢：'+ chara['pokemon'];
    }
    content += '\n道具：';
    const items = JSON.parse(chara['items']);
    for(let i = 0; i < items.length; i++){
      const item = items[i];
      content += `\n ${item.name}（${item.quality}，使用次数${item.frequency}，${item.type}）`;
    }
  }else{
    content = '目前沒有該角色的資料！';
  }
  const result = await QQ.sendMessage(senderId, unescapeHtml(content), config);
  console.log(result);
}

async function _getBag(senderId, messageContent){
  const bagRegax = /^(\/bag) ([\s\S]*) ([\s\S]*)$/;
  const teamName = bagRegax.exec(messageContent)[2];
  const target = bagRegax.exec(messageContent)[3];

  const team = await Database.fetchBag(teamName);
  let teamFullName = await Database.fetchTeam(teamName);
  teamFullName = teamFullName.full_name;

  let content = '';
  if(team){
    if(target === "道具"){
      content += `【道具包裹】${teamFullName}：`;
      const items = JSON.parse(team['items']);
      for(let i = 0; i < items.length; i++){
        const item = items[i];
        content += `\n ${item.name}（${item.quality}，使用次数${item.frequency}，${item.type}）`;
      }
    }
    if(target === "素材"){
      content += `【素材包裹】${teamFullName}：`;
      const materials = JSON.parse(team['materials']);
      for(let i = 0; i < materials.length; i++){
        const material = materials[i];
        content += `\n ${material['number']}${material['name']} (${material['value']}${material['color']} ${material['type1']}`;
        if(material['type2']){
          content += `/${material['type2']}`;
        }
        if(material['type3']){
          content += `/${material['type3']}`;
        }
        if(material['type4']){
          content += `/${material['type4']}`;
        }
        content += `)`;
      }
    }
  }else{
    content = '目前沒有該小隊的資料！';
  }
  const result = await QQ.sendMessage(senderId, unescapeHtml(content), config);
  console.log(result);
}

async function _collect(senderId, messageContent){
  const cjRegax1 = /^(\/cj) ([a-zA-Z]) ([0-9]+)$/;
  const cjRegax2 = /^(\/cj) ([^0-9]) ([\u4e00-\u9fa5]*) ([0-9]+)$/;
  const totals = [];
  let content = ``;

  if(messageContent.match(cjRegax1)){
    const teamName = cjRegax1.exec(messageContent)[2];
    const team = await Database.fetchTeam(teamName);

    const collectNumber = parseInt(cjRegax1.exec(messageContent)[3]);
    let pool = await Database.collectItem();
    const drawResults = Common.drawTarget(pool, collectNumber);
    
    content = `【${team.full_name}】`;

    for(let i = 0; i < drawResults.length; i++){
      const drawResult = drawResults[i];
      const resultIndex = totals.findIndex(function(item){
        return item.id === drawResult.id;
      });
      //If the item is not counted
      if(resultIndex === -1){
        const total = {
          id: drawResult.id,
          name: drawResult.name,
          number: 1,
        }
        totals.push(total);
      }else{
        totals[resultIndex].number += 1;
      }
    }
    //Update database
    Database.updateTeamMaterial(team.id, totals);
  }

  if(messageContent.match(cjRegax2)){
    const teamName = cjRegax2.exec(messageContent)[2];
    const team = await Database.fetchTeam(teamName);

    const collectType = cjRegax2.exec(messageContent)[3];
    const collectNumber = cjRegax2.exec(messageContent)[4];
    let pool = await Database.collectItem(collectType);
    const drawResults = Common.drawTarget(pool, collectNumber);

    content = `【${team.full_name}】`;

    for(let i = 0; i < drawResults.length; i++){
      const drawResult = drawResults[i];
      const resultIndex = totals.findIndex(function(item){
        return item.id === drawResult.id;
      });
      //If the item is not counted
      if(resultIndex === -1){
        const total = {
          id: drawResult.id,
          name: drawResult.name,
          number: 1,
        }
        totals.push(total);
      }else{
        totals[resultIndex].number += 1;
      }
    }
      //Update database
      Database.updateTeamMaterial(team.id, totals);
  }
  for(let i = 0; i < totals.length; i++){
    const item = totals[i];
    content += `${item.name}${item.number} `;
  }
  
  const result = await QQ.sendMessage(senderId, unescapeHtml(content), config);
  console.log(result);
}

async function _getFormula(senderId, messageContent){
  const formulaRegax = /^(\/pf) ([\s\S]*)$/;
  const itemName = formulaRegax.exec(messageContent)[2];
  let formula = await Database.fetchFormula(itemName);
  formula = formula.formula;

  let content = '';
  if(formula){
    content = `${itemName}的配方為： ${formula}`;
  }else{
    content = '目前沒有該配方的資料！';
  }
  const result = await QQ.sendMessage(senderId, unescapeHtml(content), config);
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