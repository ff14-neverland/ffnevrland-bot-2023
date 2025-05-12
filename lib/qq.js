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
    const helpRegax = /(^\/help$)/;
    const atRegax = /^(\/at) ([\s\S]*)$/;
    const bagRegax = /^(\/bag) ([\s\S]*) ([\s\S]*)$/;
    const cjRegax1 = /^(\/cj) ([a-zA-Z]) ([0-9]+)$/;
    const cjRegax2 = /^(\/cj) ([^0-9]) ([\u4e00-\u9fa5]*) ([0-9]+)$/;
    const formulaRegax = /^(\/pf) ([\s\S]*)$/;
    const ljRegax = /^(\/lj) ([a-zA-Z]) ([\u4e00-\u9fa5]*)([a-zA-Z])+/;
    const rollRegax = /^(\/roll) ([0-9]+d[0-9]+)/;
    const chooseRegax = /^(\/choose) ([\s\S]*)$/;

    if(content){
      if(content.match(atRegax)){
        return 'at';
      }
      if(content.match(bagRegax)){
        return 'bag';
      }
      if(content.match(cjRegax1)){
        return 'cj';
      }
      if(content.match(cjRegax2)){
        return 'cj';
      }
      if(content.match(formulaRegax)){
        return 'pf';
      }
      if(content.match(ljRegax)){
        return 'lj';
      }
      if(content.match(helpRegax)){
        return 'help';
      }
      if(content.match(rollRegax)){
        return 'roll';
      }
      if(content.match(chooseRegax)){
        return 'choose';
      }
    }
  },
  async sendMessage(senderId, content, config){
    let apiUrl = `http://${config.satoriUrl}`;
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        'group_id': senderId,
        "message": [
          {
             "type": "text",
             "data": {
                "text": content
             }
          }
       ]
      })
    };
    const response = await fetch(`${apiUrl}/send_group_msg`, options);
    const resultJson = await response.json();
    return resultJson;
  },

  async sendPrivateMessage(senderId, content, config){
    let apiUrl = `http://${config.satoriUrl}`;
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        'user_id': senderId,
        "message": [
          {
             "type": "text",
             "data": {
                "text": content
             }
          }
       ]
      })
    };
    const response = await fetch(`${apiUrl}/send_private_msg`, options);
    const resultJson = await response.json();
    return resultJson;
  }
}
export default QQ;
