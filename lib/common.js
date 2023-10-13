import fs from 'fs';
import path from 'path';
import random from 'random';
const poolFile = fs.readFileSync('./pool.json', 'utf-8');
const pool = JSON.parse(poolFile);

const Common = {
    rollDice(diceNum, rollNum){
        const diceResults = [];
        for(let i = 0; i < diceNum; i++){
            const diceResult = random.int(1, rollNum);
            diceResults.push(diceResult);
        }
        return diceResults;
    },
    choose(options){
        const index = random.int(0, options.length -1);
        const result = options[index];
        return result;
    },
    draw(){
        let items = pool.items;
        items.forEach(function(item){
            for(let i = 0; i < item.number; i++){
                items.push(item);
            }
        });
        this._shuffle(items);
        const results = [];
        const result = items[Math.floor(Math.random() * items.length)];
        results.push(result);
        return results;
    },
    drawTen(){
        let items = pool.items;
        items.forEach(function(item){
            for(let i = 0; i < item.number; i++){
                items.push(item);
            }
        });
        this._shuffle(items);
        const results = [];
        for(let i = 0; i < 11; i++){
            const result = items[Math.floor(Math.random() * items.length)];
            results.push(result);
        }
        return results;
    },
    _shuffle(arr){
        var i = arr.length, t, j;
        while (i) {
            j = Math.floor(Math.random() * i--);
            t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
      }
    },
}
export default Common;
