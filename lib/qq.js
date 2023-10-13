import querystring from 'querystring';
import fetch from 'node-fetch';

const QQ = {
  /**
  * Read content and return command type
  * @param {String} Content of QQ Message.
  * @returns {String} Command Type of Message.
  *
  */
  readCommand(content){
    const latestRegax = /(^\/latest$)/;
    const helpRegax = /(^\/help$)/;
    const whoRegax = /^(\/who) ([\s\S]*)$/;
    const countRegax = /^(\/count)/;
    const countRegaxFull = /^(\/count) ([\s\S]*)/;
    const rollRegax = /^(\/roll) ([0-9]+d[0-9]+)/;
    const itemsRegax = /^(\/items)/
    const itemsRegaxFull = /^(\/items) ([\s\S]*)$/;
    const chooseRegax = /^(\/choose) ([\s\S]*)$/;
    const adminRegax = /^(\/admin) ([\s\S]*) ([\s\S]*) ([\s\S]*)$/;
    const drawRegax = /(^\/draw$)/;
    const drawRegaxFull = /^(\/draw) ([\s\S]*)/;
    const itemRecordRegax = /^(\/itemRecord) ([\s\S]*) ([\s\S]*)$/;
    const deleteItemRegax = /^(\/deleteItem) ([\s\S]*)$/;

    if(content){
      if(content.match(latestRegax)){
        return 'latest';
      }
      if(content.match(helpRegax)){
        return 'help';
      }
      if(content.match(whoRegax)){
        return 'who';
      }
      if(content.match(rollRegax)){
        return 'roll';
      }
      if(content.match(countRegax) || content.match(countRegaxFull)){
        return 'count';
      }
      if(content.match(itemsRegax) || content.match(itemsRegaxFull)){
        return 'items';
      }
      if(content.match(chooseRegax)){
        return 'choose';
      }
      if(content.match(adminRegax)){
        return 'admin';
      }
      if(content.match(drawRegax) || content.match(drawRegaxFull)){
        return 'draw';
      }
      if(content.match(itemRecordRegax)){
        return 'itemRecord';
      }
      if(content.match(deleteItemRegax)){
        return 'deleteItem';
      }
    }
  },
  async sendMessage(senderId, content, config){
    let apiUrl = `http://${config.satoriUrl}`;
    const body = {
      message: content,
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${config.satoriToken}`
      },
      body: JSON.stringify({
        'channel_id': senderId,
        'content': content
      })
    };
    const response = await fetch(`http://${config.satoriUrl}/v1/message.create`, options);
    const resultJson = await response.json();
    return resultJson;
  }
}
export default QQ;
