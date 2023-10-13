import querystring from 'querystring';
import striptags from 'striptags';
const Wordpress = {
  /**
  * @promise Fetch category from wordpress
  * @param {Object} request module for fetch data from wordpress.
  * @returns {Promise} A promise that returns category info if resolved.
  *
  */
  fetchCategories(request){
    return new Promise((resolve, reject) => {
      request.get('http://api.ffneverland.site/wp-json/wp/v2/categories',
      function (err, response, body) {
        if(err){
          console.log(err);
          return;
        }
        switch(response.statusCode){
          case 200:
          const datas = JSON.parse(body);
          const categorys = [];
          for(let i = 0; i < datas.length; i++){
            const count = datas[i].count;
            if(count !== 0){
              const categoryName = datas[i].name;
              categorys.push(categoryName);
            }
          }
          resolve(categorys);
          break;

          default:
          const error = {
            'status': response.statusCode,
          };
          reject(error);
        }
      });
    });
  },
  /**
  * @promise Fetch lastest content from wordpress
  * @param {Object} request module for fetch data from wordpress.
  * @returns {Promise} A promise that returns lastest content info if resolved.
  *
  */
  async fetchLatest(limit, config){
    const response = await fetch(`${config.wordpressUrl}/wp-json/wp/v2/posts?per_page=${limit}`);
    const datas = await response.json();
    const contents = [];
    for(let i = 0; i < datas.length; i++){
      const content = {
        'title': datas[i].title.rendered.replace(/&#038;/g, '&'),
        'link': 'http://ffneverland.site/#/post/' + datas[i].id,
      };
      contents.push(content);
    }
    return contents;
  },
  async fetchChara(config, name){
    const query = querystring.stringify({
      'categories': 4,
      'per_page' : 100,
      'search': name,
    });
    const response = await fetch(`${config.wordpressUrl}/wp-json/wp/v2/posts?${query}`);
    const datas = await response.json();
    const charas = [];
    for(let i = 0; i < datas.length; i++){
      const data = datas[i];
      const title = data.title.rendered.replace(/&#038;/g, '&');
      const link = 'http://ffneverland.site/#/chara/' + data.id;
      const nameRegax = new RegExp(name);
      if(title.match(nameRegax)){
        const chara = {
          title,
          link,
        };
        if(data.custom_fields['字數']){
          chara.textCount = data.custom_fields['字數'];
        }
        if(data.custom_fields['經驗值']){
          chara.exp = data.custom_fields['經驗值'];
        }
        if(data.custom_fields['qq號']){
          chara.qq = data.custom_fields['qq號'];
        }else{
          chara.qq = null;
        }
        charas.push(chara);
      }
    }
    return charas;
  },
  async updateChara(config, name, action, value){
    const updateFunc = this._updateChara;
    const searchFunc = this.searchChara;
    const query = querystring.stringify({
      'categories': 4,
      'per_page' : 100,
      'slug': name,
    });

    const response = await fetch(`${config.wordpressUrl}/wp-json/wp/v2/posts?${query}`);
    const datas = await response.json();

    if(Object.keys(datas).length !== 0){
      const chara = datas[0];
      const charaQQ = chara.custom_fields['qq號'];
      const targetCharas = await searchFunc(config, charaQQ);
      let updateContent = null;
      if(targetCharas.length > 1){
        for(let i = 0; i < targetCharas.length; i++){
          const targetChara = targetCharas[i];
          updateContent = {
            id: targetChara['ID'],
          };
          updateContent[action] = value;
          await updateFunc(config, updateContent);
        }
      }else{
        updateContent = {
          id: chara.id,
        };
        updateContent[action] = value;
        await updateFunc(config, updateContent);
      }
    }
  },
  async searchChara(config, qq){
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        qq: qq,
      })
    };
    const response = await fetch(`${config.wordpressUrl}/wp-json/neverland/v1/character/search`, options);
    const data = await response.json();
    return data;
  },
  async getItemList(config, qq){
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        qq: qq,
      })
    };
    const response = await fetch(`${config.wordpressUrl}/wp-json/neverland/v1/items`, options);
    const data = await response.json();
    return data;
  },
  async updateItemList(config, qq, itemName, itemNumber){
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        qq: qq,
        'item_name': itemName,
        'item_number': itemNumber,
      })
    };
    const response = await fetch(`${config.wordpressUrl}/wp-json/neverland/v1/items/update`, options);
    const data = await response.json();
    return data;
  },
  async deleteItem(config, qq, itemName){
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        qq: qq,
        'item_name': itemName,
      })
    };
    const response = await fetch(`${config.wordpressUrl}/wp-json/neverland/v1/items/delete`, options);
    const data = await response.json();
    return data;
  },
  async _updateChara(config, content){
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(content)
    };
    const response = await fetch(`${config.wordpressUrl}/wp-json/neverland/v1/character/update`, options);
    const data = await response.json();
    return data;
  }
}
export default Wordpress;
