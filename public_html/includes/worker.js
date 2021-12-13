self.addEventListener('message', receiveMessage);

var mrowka;
var jedzonko;
var following;
var turnrandomly;
var randomturnangle;
var canvaswidth;
var canvasheight;
var mrowkacount;
var pi = Math.PI;

function receiveMessage(e) {
  id = e.data.id;
  mrowka = e.data.mrowkatosend;
  jedzonko = e.data.jedzonko;
  following = e.data.following;
  turnrandomly = e.data.turnrandomly;
  randomturnangle = e.data.randomturnangle;
  canvaswidth = parseInt(e.data.canvaswidth);
  canvasheight = parseInt(e.data.canvasheight);
  mrowka.forEach(mroweczka => mroweczka = move(mroweczka));
  self.postMessage({mrowka, jedzonko, canvaswidth, canvasheight, id});
}

function calcdist(x1, y1, x2, y2){
  return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}

function makerandomturn(direction){
    let addornot = randomfromrange(0, 3);
    if(addornot == 1){
      return direction + randomfromrange(0, randomturnangle);; 
    } else if(addornot == 0){
      return direction - randomfromrange(0, randomturnangle);; 
    }
    return direction;
  }
  
function kill(id){
  let temp = id;
  mrowka = mrowka.filter(m => m.id != temp);
}
  
function findangle(x, y, mrowkax, mrowkay, mrowkahalfsize){ 
  let newx = -(mrowkax - x + mrowkahalfsize);
  let newy = (mrowkay - y + mrowkahalfsize);
  return Math.atan2(newy, newx)*(180 / pi);
}

function trytokill(energy, id){
  if(energy <= 0){
    kill(id);
  }
}

function closestfood(x, y, halfsize){
  jedzonko.forEach(jedzoneczko => { 
    jedzoneczko.dist = calcdist(x + halfsize, y + halfsize, jedzoneczko.x, jedzoneczko.y); 
  });
  let closestjedzonko = Math.min(... jedzonko.map(j => j.dist));
  return jedzonko.find(j => j.dist == closestjedzonko);
}

function checkhp(temp){
  if(temp.hp <= 0){
    jedzonko = jedzonko.filter(j => j.id != temp.id);
  }
}

function checkwalls(x, y, size, direction){
  if(x >= canvaswidth - size){
    x = canvaswidth - 1 - size;
    direction += 10;
  }
  if(x <= 0){
    x = 1;
    direction += 10;
  }
  if(y >= canvasheight - size){
    y = canvasheight - 1 - size;
    direction += 10;
  }
  if(y <= 0){
    y = 1;
    direction += 10;
  }
  return {x, y, direction};
}

function move(mrowka){
    if(mrowka.state == 'follow' && !jedzonko.length){
      mrowka.state = 'wander';
    }
    
    if(mrowka.state == 'wander' && jedzonko.length){
      mrowka.state = 'follow';
    }
    
    if(mrowka.state != 'followc'){
      mrowka.pointx = 0;
      mrowka.pointy = 0;
    }
    
    if(mrowka.state == 'follow' && !following){
      
        mrowka.closestid = closestfood(mrowka.x, mrowka.y, mrowka.halfsize).id;
        let closestjedzonko = jedzonko.find(j => j.id == mrowka.closestid);
        mrowka.pointx = closestjedzonko.x;
        mrowka.pointy = closestjedzonko.y;
        mrowka.followsize = closestjedzonko.size;
    }
        
    mrowka.dist = calcdist(mrowka.x + mrowka.halfsize, mrowka.y + mrowka.halfsize, mrowka.pointx, mrowka.pointy);
    
    if((mrowka.state != 'wander' && mrowka.state != 'follow') || (mrowka.state == 'follow' && mrowka.dist <= mrowka.sight)){
      mrowka.direction = findangle(mrowka.pointx, mrowka.pointy, mrowka.x, mrowka.y, mrowka.halfsize);
    }
    
    if(turnrandomly){
      mrowka.direction = makerandomturn(mrowka.direction);
    }
    
    
    if(mrowka.dist > mrowka.followsize+mrowka.halfsize || mrowka.state == 'wander' || mrowka.state == 'followc'){
      mrowka.x += Math.round(mrowka.step*Math.cos((mrowka.direction*pi)/180));
      mrowka.y -= Math.round(mrowka.step*Math.sin((mrowka.direction*pi)/180));
      let tempstat = checkwalls(mrowka.x, mrowka.y, mrowka.size, mrowka.direction);
      mrowka.x = tempstat.x;
      mrowka.y = tempstat.y;
      mrowka.direction = tempstat.direction;
    } else {
      mrowka.closestid = closestfood(mrowka.x, mrowka.y, mrowka.halfsize).id;
      let temp = jedzonko.findIndex(j => j.id == mrowka.closestid);
      
      
      jedzonko[temp].hp -=10;
      checkhp(jedzonko[temp]);
      
      
      mrowka.food += 1;
      if(mrowka.food == 2){
        mrowka.food = 0;
        mrowka.makesimilar = 1;
      }
    }
    mrowka.energy -= (mrowka.size*3 + mrowka.step*mrowka.step*mrowka.step + mrowka.sight/50)/mrowka.metabolism
    trytokill(mrowka.energy, mrowka.id);
    return(mrowka)
  }
  
  function randomfromrange(min, max){
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}