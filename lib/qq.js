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
    const rollRegax = /^(\/roll) ([0-9]+d[0-9]+)/;
    const chooseRegax = /^(\/choose) ([\s\S]*)$/;

    if(content){
      if(content.match(atRegax)){
        return 'at';
      }
      if(content.match(bagRegax)){
        return 'bag';
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
    const body = {
      message: content,
    };
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
    const response = await fetch(`http://${config.satoriUrl}/send_group_msg`, options);
    const resultJson = await response.json();
    return resultJson;
  }
}
export default QQ;
