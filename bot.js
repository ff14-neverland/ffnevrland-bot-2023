import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

import Wordpress from './lib/wordpress.js';
import QQ from './lib/qq.js';
import Hpp from './lib/hpp.js';
import Common from './lib/common.js';

const configFile = fs.readFileSync('./config.json', 'utf-8');
const config = JSON.parse(configFile);

//參考 https://satori.js.org/zh-CN/protocol/events.html 建立Websocket 接收指令
const ws = new WebSocket(`ws://${config.satoriUrl}/v1/events`);

ws.on('error', console.error);

/* 连接建立后，在 10s 内发送一个 IDENTIFY 信令，用于鉴权和恢复会话；
SDK 收到后会回复一个 READY 信令，并开启事件推送；
*/
ws.on('open', function open() {
  const token = JSON.stringify({
    'op': 3,
    'body':{
      'token': config.satoriToken,
    }
  }
);
ws.send(token);
});

ws.on('message', async function message(data) {
  console.log('received: %s', data);
  const jsonData = JSON.parse(data);
  //假如接收到的事件為Message，讀取內容
  if(jsonData.body && jsonData.body.channel && jsonData.body.channel.type === 0){
    const dataBody = jsonData.body;
    const userId = dataBody.user.id;
    const senderId = dataBody.channel.id;
    const messageContent = dataBody.message.content;
    const command = QQ.readCommand(messageContent);

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

      case 'draw':
      _draw(senderId, userId, messageContent);
      break;

      case 'itemRecord':
      _itemRecord(senderId, userId, messageContent);
      break;

      case 'hppBattle':
      _hppBattle(senderId, messageContent);
      break;

      case 'hppStatus':
      _hppStatus(senderId, messageContent);
      break;
    }
  }
});

async function _getLatest(senderId, messageType){
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

async function _hppBattle(senderId, messageContent){
  const battleRegax = /^(\/battle) ([\s\S]*) ([\s\S]*) ([\s\S]*)$/;
  const chara1 = battleRegax.exec(messageContent)[2];
  const chara2 = battleRegax.exec(messageContent)[3];
  const magic = battleRegax.exec(messageContent)[4]
  const battleResult = await Hpp.getBattleResult(config, chara1, chara2, magic);
  let content = `${chara1} 使用咒語 ${magic} 攻击${chara2}，实际命中率${battleResult["实际命中率"]}，实际暴击率${battleResult["实际暴击率"]}，实际伤害值${battleResult["实际伤害值"]}`;
  const result = await QQ.sendMessage(senderId, content, config);
}

async function _hppStatus(senderId, messageContent){
  const statusRegax = /^(\/status) ([\s\S]*)$/;
  const charaName = statusRegax.exec(messageContent)[2];
  const status = await Hpp.getStatus(config, charaName);
  let content = `${charaName}数值： HP ${status.HP}， 攻击 ${status["攻擊"]}，防禦 ${status["防禦"]}，速度 ${status["速度"]}`;
  const result = await QQ.sendMessage(senderId, content, config);
}

/* 连接建立后，每隔 10s 向 SDK 发送一次 PING 信令；
SDK 收到后会回复一个 PONG 信令；
*/

function sendPong(){
  const ping = JSON.stringify({
    'op': 1,
  });
  ws.send(ping);
}

setInterval(sendPong, 10000);
