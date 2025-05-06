import querystring from 'querystring';
import striptags from 'striptags';

const Database = {
  async fetchChara(charaName){
    const response = await fetch(`http://alp.ffneverland.site/api/chara`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
        body: JSON.stringify({'name': charaName}),
        method: "POST",
    });
    const chara = await response.json();
    return chara;
  },
  async fetchBag(teamName){
    const response = await fetch(`http://alp.ffneverland.site/api/team/`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
        body: JSON.stringify({'name': teamName}),
        method: "POST",
    });
    const chara = await response.json();
    return chara;
  }
}
export default Database;
