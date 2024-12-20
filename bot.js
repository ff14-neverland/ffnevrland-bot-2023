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
      case 'latest':
        _getLatest(senderId);
      break;

      case 'help':
        _getHelp(senderId);
      break;

      case 'count':
        _getCount(senderId, userId, messageContent);
      break;

      case 'who':
        _getWho(senderId, messageContent);
      break;

      case 'roll':
        _roll(senderId, messageContent);
      break;

      case 'items':
        _getItems(senderId, userId, messageContent);
      break;

      case 'choose':
        _choose(senderId, messageContent);
      break;

      case 'admin':
        _admin(senderId, userId, messageContent);
      break;

      case 'draw':
        _draw(senderId, userId, messageContent);
      break;

      case 'itemRecord':
        _itemRecord(senderId, userId, messageContent);

      case 'deleteItem':
       _deleteItem(senderId, userId, messageContent);
    }
  }else{
      ctx.body = 'Please provide QQ message.';
  }
});

console.log('Start at 2000 port.');
app.listen(2000);

async function _getLatest(senderId){
  const articles = await Wordpress.fetchLatest(5, config);
  let content = '以下是最新5篇文章：';
  for(let i = 0; i < articles.length; i++){
    content += '\n' + articles[i].title;
    content += '\n' + articles[i].link;
  }
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _getHelp(senderId){
  let content = '目前指令：';
  content += '\n /latest 查看Neverland 最新五篇文章';
  content += '\n /who (角色名) 獲得角色卡連結';
  content += '\n /roll (骰子數量)d(骰子面數) 擲骰功能。範例：1顆100面的骰子= 1d100';
  content += '\n /count (角色名) 查詢角色統計字數，經驗值及圖腾數。查詢自己的場合，可選擇不輸入角色名。';
  content += '\n /items (角色名) 查詢角色道具清單。查詢自己的場合，可選擇不輸入角色名';
  content += '\n /choose (選項) 睡鼠老師，幫我選擇！格式範例：選項1|選項2。建議小窗使用。';
  content += '\n /itemRecord (道具)(價錢) 道具記錄功能。範例：/itemRecord 道具名 500';
  content += '\n /deleteItem (道具) 刪除已擁有的道具。範例：/deleteItem 道具名，請小心使用！';
  content += '\n /draw 自動抽卡機。需要消耗字數。範例：/draw，十連抽則為 /draw 十连';
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _getCount(senderId, userId, messageContent){
  const nameRegax = /(\/count) ([\s\S]*)/;
  let name = nameRegax.exec(messageContent);
  let chara = null;
  //假如用戶輸入了角色名稱，直接搜索
  if(name){
    name = name[2];
    const charas = await Wordpress.fetchChara(config, name);
    if(charas){
      chara = charas[0];
    }
  }else{
    //否則只搜索QQ號。
    const charas = await Wordpress.searchChara(config, userId);
    if(charas.length !== 0){
      let charaInfo = charas[0];
      const charaName = charaInfo['post_title'];
      chara = (await Wordpress.fetchChara(config, charaName))[0];
    }
  }
  if(!chara){
    await QQ.sendMessage(senderId, '找不到此角色！', config);
    return;
  }
  let content = '';
  if(chara['textCount']){
    content = '角色' + chara['title'] + '目前狀態：';
    content += '\n統計字數：' + chara['textCount'];
    content += '\n經驗值：'+ chara['exp'];
    content += '\n圖腾數：'+ Math.round(chara['textCount'] / 500);
  }else{
    content = '目前沒有該角色的統計資料！';
  }
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _getWho(senderId, messageContent){
  const nameRegax = /(\/who) ([\s\S]*)/;
  const name = nameRegax.exec(messageContent)[2];
  const charas = await Wordpress.fetchChara(config, name);
  if(!charas){
    await QQ.sendMessage(senderId, '找不到此角色！', config);
    return;
  }
  let content = '角色名：';
  for(let i = 0; i < charas.length; i++){
    const chara = charas[i];
    content += '\n' + chara['title'];
    content += '\n角色卡連結：';
    content += '\n' + chara['link'];
    content += '\n';
  }
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
  const result = await QQ.sendMessage(senderId, content, config);
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
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _getItems(senderId, userId, messageContent){
  const nameRegax = /(\/items) ([\s\S]*)/;
  let name = nameRegax.exec(messageContent);
  let chara = null;
  const items = [];
  //假如用戶輸入了角色名稱，直接搜索
  if(name){
    name = name[2];
    const charas = await Wordpress.fetchChara(config, name);
    //取得QQ號並搜尋相關道具清單
    if(charas.length !== 0){
      chara = charas[0];
      if(chara['qq']){
        const qqNumber = chara['qq'];
        const itemList = await Wordpress.getItemList(config, qqNumber);
        for(let i = 0; i < itemList.length; i++){
          const item = itemList[i];
          const itemInfo = {'name': item['item_name'], 'number': item['item_number']};
          items.push(itemInfo);
        }
      }
    }
  }else{
    //否則只搜索QQ號。
    const charas = await Wordpress.searchChara(config, userId);
    if(charas.length !== 0){
      let charaInfo = charas[charas.length - 1];
      const charaName = charaInfo['post_title'];
      chara = (await Wordpress.fetchChara(config, charaName))[0];
      const itemList = await Wordpress.getItemList(config, userId);
      for(let i = 0; i < itemList.length; i++){
        const item = itemList[i];
        const itemInfo = {'name': item['item_name'], 'number': item['item_number']};
        items.push(itemInfo);
      }
    }
  }
  if(!chara){
    await QQ.sendMessage(senderId, '找不到此角色！', config);
    return;
  }
  let content = '';
  if(items.length !== 0){
    content = '角色 ' + chara['title'] + ' 目前的道具清單：';
    let totalPrice = 0;
    for(let i = 0; i < items.length; i++){
      const item = items[i];
      content += '\n' + item['name'] + ' 價格:' + item['number'];
      totalPrice += parseInt(item['number']);
    }
    content += '\n總計：' + totalPrice;
  }else{
    content = '目前沒有該角色的道具資料！';
  }
  const result = await QQ.sendMessage(senderId, content, config);
  console.log(result);
}

async function _draw(senderId, userId, messageContent){
  const charas = await Wordpress.searchChara(config, userId);
  const drawRegax = /^(\/draw) ([\s\S]*)/;
  let drawType = 'one';
  if(drawRegax.exec(messageContent)){
    const command = drawRegax.exec(messageContent)[2];
    if(command === '十连'){
      drawType = 'ten';
    }
  }
  if(charas.length !== 0){
    let firstChara = charas[0];
    const firstCharaName = firstChara['post_title'];
    firstChara = (await Wordpress.fetchChara(config, firstCharaName))[0];
    let textCount = firstChara['textCount'];
    let content = '';
    if(drawType !== 'ten'){
      if(textCount > 500){
        const drawResult = Common.draw();
        content = '@[时空狭缝]等级检测仪 ' + '\n' + firstCharaName + '的抽卡结果：\n';
        content += drawResult[0]['type'] + '：' + drawResult[0]['name'];
        textCount = textCount - 500;
      }else{
        content = '抱歉，你的字數不足，無法抽獎！';
      }
    }else{
      if(textCount > 5000){
        const drawResults = Common.drawTen();
        content = '@[时空狭缝]等级检测仪 ' + '\n' + firstCharaName + '的抽卡结果：\n';
        for(let i = 0; i < drawResults.length; i++){
          content += drawResults[i]['type'] + '：' + drawResults[i]['name'] + '\n';
        }
        textCount = textCount - 5000;
      }else{
        content = '抱歉，你的字數不足，無法抽獎！';
      }
    }
    for(let i = 0; i < charas.length; i++){
      const actionType = 'textCount';
      const charaName = charas[i]['post_title'];
      Wordpress.updateChara(config, charaName, actionType, textCount);
    }
    content += '\n你的剩餘字數：' + textCount + '字';
    await QQ.sendMessage(senderId, content, config);
  }else{
    await QQ.sendMessage(senderId, '目前沒有該角色的資料！', config);
  }
}

async function _itemRecord(senderId, userId, messageContent){
  let content = '';
  const actionRegax = /(\/itemRecord) ([\s\S]*) ([\s\S]*)/;

  let itemName = actionRegax.exec(messageContent);
  itemName = itemName[2];

  let itemNumber = actionRegax.exec(messageContent);
  itemNumber = itemNumber[3];

  if(!parseInt(itemNumber) && itemNumber != 0){
    content = '請輸入正確的道具價格！';
    await await QQ.sendMessage(senderId, content, config);
    return;
  }
  const result = await Wordpress.updateItemList(config, userId, itemName, itemNumber);
  console.log(result);
  content = '已成功新增道具： ' + itemName + ', 價格為：' + itemNumber;
  await QQ.sendMessage(senderId, content, config);
}

async function _deleteItem(senderId, userId, messageContent){
  let content = '';
  const actionRegax = /(\/deleteItem) ([\s\S]*)/;
  let itemName = actionRegax.exec(messageContent);
  itemName = itemName[2];

  const result = await Wordpress.deleteItem(config, userId, itemName);
  if(result['result'] == '1'){
    content = '已刪除道具： ' + itemName;
  }else{
    content = '找不到此道具，無法刪除';
  }
  await QQ.sendMessage(senderId, content, config);
}