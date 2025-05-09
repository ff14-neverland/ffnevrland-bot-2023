import querystring from 'querystring';
import striptags from 'striptags';

const Database = {
  async fetchTeam(teamName){
    const response = await fetch(`http://alp.ffneverland.site/api/team`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
        body: JSON.stringify({'name': teamName}),
        method: "POST",
    });
    const chara = await response.json();
    return chara;
  },
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
  async collectItem(type){
    const body = {};
    if(type){
      body.type = type;
    }
    const response = await fetch(`http://alp.ffneverland.site/api/pool/`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(body),
      method: "POST",
    });
    const pool = await response.json();
    return pool;
  },
  async fetchFormula(itemName){
    const response = await fetch(`http://alp.ffneverland.site/api/formula/`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
        body: JSON.stringify({'item': itemName}),
        method: "POST",
    });
    const formula = await response.json();
    return formula;
  },
  async fetchBag(teamName){
    const response = await fetch(`http://alp.ffneverland.site/api/team/`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
        body: JSON.stringify({'name': teamName}),
        method: "POST",
    });
    const bag = await response.json();
    return bag;
  },
  async updateTeamMaterial(teamId, materials){
    const response = await fetch(`http://alp.ffneverland.site/api/team-material/${teamId}`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
        body: JSON.stringify({'materials': materials}),
        method: "POST",
    });
    const bag = await response.json();
    return bag;
  }
}
export default Database;
