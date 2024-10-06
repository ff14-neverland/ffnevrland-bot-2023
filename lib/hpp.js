import querystring from 'querystring';
import striptags from 'striptags';
const Hpp = {
  async getStatus(config, charaName){
    const query = querystring.stringify({
      'chara': charaName,
    });
    const response = await fetch(`${config.hppApiUrl}/status?${query}`);
    const datas = await response.json();
    return datas;
  },
  async getBattleResult(config, chara1, chara2, magic){
    const query = querystring.stringify({
      'chara1': chara1,
      'chara2': chara2,
      'magic': magic,
    });
    const response = await fetch(`${config.hppApiUrl}/battle?${query}`);
    const datas = await response.json();
    return datas;
  },
}
export default Hpp;