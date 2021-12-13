var timerid;
var timerid2;
var mousex;
var mousey;
main = document.getElementById("main");
main = getComputedStyle(main);
var canvasheight = main.height;
var canvaswidth = main.width;
var canvas = document.getElementById("symulacja");
canvas.setAttribute("height", canvasheight);
canvas.setAttribute("width", canvaswidth);
var canvas2d = canvas.getContext("2d");
canvas2d.mozImageSmoothingEnabled = false;
canvas2d.webkitImageSmoothingEnabled = false;
canvas2d.msImageSmoothingEnabled = false;
canvas2d.imageSmoothingEnabled = false;
var frame1 = new Image();
var frame2 = new Image(); 
frame1.src = 'mrowka1.png';
frame2.src = 'mrowka2.png';
var following = false;
var spawningfood = false;
var frame = 0;
var circle = Math.PI*2;
var framestart = 0, frameend = 0;
var liczbamrowek = 2;
var startingenergy = 5000;
var inisight = 50;
var inistep = 2;
var inisize = 10;
var inimetabolism = 2;
var randomsize = true;
var randomstep = true;
var randomsight = true;
var randommetabolism = true;
var frametime = [];
var clickmode = "spawnfood"; //follow, spawnfood
var randomturnangle = 10;
var startfromcenter = false;
var turnrandomly = true;
var followfood = true;
var randomnessfactor = 2; //default is 10, lesser is more random
var frameavg = 0;
var first = true;
var liczbajedzonek = 15;
var foodsize = 15;
var jedzonkospawntime = 9000;
var jedzonkospawncount = 50;

var serverdata = 0;

var xmlHttp = new XMLHttpRequest();

function randomfromrange(min, max){
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makemrowkaobj(){
  let temp = new Mrowka(mrowkacount);
  temp.frame = makemrowka(temp.frame, temp.x, temp.y, temp.size, temp.halfsize, temp.direction);
  mrowka.push(temp);
  mrowkacount++;
}

function renderstats(){
  setInterval(()=>{
    showhowmuchmrowka();
    showavg('step');
    showavg('size');
    showavg('sight');
    showavg('energy');
    showavg('metabolism');
    showfps();
  }, 50);  
}

function renderframe(){  

  canvas2d.clearRect(0, 0, canvas.width, canvas.height);
  if(clickmode == "spawnfood" && spawningfood == true){
    for(let i=0;i<30;i++){
      let randx = mousex+randomfromrange(0, 10)-randomfromrange(0, 10);
      if(randx<1){
        randx = 1;
      }
      if(randx>canvaswidth-1){
        randx = canvaswidth-1;
      }
      let randy = mousey+randomfromrange(0, 10)-randomfromrange(0, 10);
      if(randy<1){
        randy = 1;
      }
      if(randy>canvasheight-1){
        randy = canvasheight-1;
      }
      let temp = new Jedzonko(jedzonkocount, randx, randy);
      makefood(temp.x, temp.y, temp.size, temp.color);
      jedzonko.push(temp);
      jedzonkocount += 1;
    }
  }

  jedzonko.forEach(jedzoneczko => makefood(jedzoneczko.x, jedzoneczko.y, jedzoneczko.size, jedzoneczko.color));
  mrowka.forEach(mroweczka => mroweczka.frame = makemrowka(mroweczka.frame, mroweczka.x, mroweczka.y, mroweczka.size, mroweczka.halfsize, mroweczka.direction));

  mrowka.forEach(mroweczka => {
    if(mroweczka.makesimilar){
      makesimilar(mroweczka.size, mroweczka.sight, mroweczka.step, mroweczka.metabolism);
      mroweczka.makesimilar = 0;
    }
  });


  if(frame >= jedzonkospawntime/60){
    jedzonkospawntime+=1000;
    for(let i=0;i<jedzonkospawncount;i++){
      let temp = new Jedzonko(jedzonkocount);
      makefood(temp.x, temp.y, temp.size, temp.color);
      jedzonko.push(temp);
      jedzonkocount += 1;
    }
    frame = 0;
  } else {
    frame++;
  }

  frametime[frameavg] = window.performance.now() - framestart;
  framestart = window.performance.now();
  frameavg++;
  if(frameavg == 4){
    frameavg = 0;
  }

  let datatosend = {mrowka, jedzonko, following, turnrandomly, randomturnangle, canvaswidth, canvasheight};
  
  xmlHttp.open( "POST", 'http://localhost:8000', false);
  xmlHttp.send(JSON.stringify(datatosend));
  
  let requesteddata = JSON.parse(xmlHttp.responseText);
  mrowka = requesteddata.mrowka;
  jedzonko = requesteddata.jedzonko;
}

function showfps(){
  let span = document.getElementById("fps");
  while(span.firstChild){
    span.removeChild(span.firstChild);
  }
  span.appendChild(document.createTextNode(Math.round((1000/((frametime[0]+frametime[1]+frametime[2]+frametime[3])/4))*100)/100));
}

function showavg(stat){
  let span = document.getElementById(stat);
  while(span.firstChild){
    span.removeChild(span.firstChild);
  }
  span.appendChild(document.createTextNode(Math.round(getaveragestat(stat)*100)/100));
}

function startall(){
  timerid = setInterval(()=>{
    renderframe();
  }, 16);  
}

function showhowmuchmrowka(){
  let span = document.getElementById('mrowkacount');
  while(span.firstChild){
    span.removeChild(span.firstChild);
  }
  span.appendChild(document.createTextNode(mrowka.length));
}

function getaveragestat(stat){
  let count = mrowka.length;
  let sum = 0;
  let avg;
  mrowka.forEach((mroweczka) => sum += mroweczka[stat]);
  if(count>0){
    return avg = sum/count;
  }
}

function doxsteps(steps){
  for(let i=0;i<steps;i++){
    renderframe();
  }
}

function stopall(){
  clearInterval(timerid);
}

function movestepbystep(){
  stepnumber = document.getElementById('stepsnumber').value;
  if(stepnumber > 0){
  doxsteps(stepnumber);
  } else {
    window.alert("either negative number or nan");
  }
}

function makefood(x, y, size, color){
  canvas2d.beginPath();
  canvas2d.arc(x, y, size, 0, circle);
  canvas2d.fillStyle = color;
  canvas2d.fill();
  canvas2d.closePath();
}

function makemrowka(frame, x, y, size, halfsize, direction){
  canvas2d.save();
  canvas2d.translate(x+halfsize,y+halfsize);

  canvas2d.rotate((90-direction)*Math.PI/180);
  canvas2d.translate(-x-halfsize,-y-halfsize);
  
  if(frame < 5){
    canvas2d.drawImage(frame1, x, y, size, size);
    frame++;
  } else {
    canvas2d.drawImage(frame2, x, y, size, size);
    frame++;
    if(frame >=9){
      frame = 0;
    }
  }
  
  canvas2d.restore();
  return frame;
}

class Jedzonko{
  constructor(id, x = 0, y = 0){
    this.id = id;
    this.size = foodsize;
    this.halfsize = this.size/2;
    this.color = '#FAC834';
    if(x == 0){
      this.x = randomfromrange(this.size, canvas.width-this.size);
    } else {
      this.x = x;
    }
    if(y == 0){
      this.y = randomfromrange(this.size, canvas.height-this.size);
    } else {
      this.y = y;
    }
    this.hp = 10;
  }
}

function makesimilar(size, sight, step, metabolism){
  let temp = new Mrowka(mrowkacount, size, sight, step, metabolism);
  temp.frame = makemrowka(temp.frame, temp.x, temp.y, temp.size, temp.halfsize, temp.direction);
  mrowka.push(temp);
  mrowkacount++;
}

class Mrowka{
  constructor(id, size = inisize, sight = inisight, step = inistep, metabolism = inimetabolism){
    this.id = id;
    this.state = 'follow'; //wander, follow, followc, bring
    this.oldstate = 'wander';
    this.size = size;
    this.sight = sight;
    this.step = step;
    this.makesimilar = 0;
    this.metabolism = metabolism;
    this.color = 'blue';
    this.energy = startingenergy;
    this.food = 0;
    this.frame = 0;
    this.direction = randomfromrange(0, 359);
    this.x = randomfromrange(this.size, canvas.width-this.size);
    this.y = randomfromrange(this.size, canvas.height-this.size);
    this.pointx = 0;
    this.pointy = 0;
    this.dist = 0;
    this.closestid = 0;
    this.followsize = 0;
    this.halfsize = this.size/2;
    
    if(randomsize){
      this.size += randomfromrange(-2, 2)/randomnessfactor;
      if(this.size < 5){
        this.size = 5;
      }
    }
    if(randomstep){
      this.step += randomfromrange(-2, 2)/randomnessfactor;
      if(this.step < 0){
        this.step = 0;
      }
    }
    if(randomsight){
      this.sight += randomfromrange(-40, 40)/randomnessfactor;
      if(this.sight < 0){
        this.sight = 0;
      }
    }
    if(randommetabolism){
      this.metabolism += randomfromrange(-3, 3)/randomnessfactor;
      if(this.metabolism < 1){
        this.metabolism = 1;
      }
    }
    
    if(startfromcenter){
      this.x = canvas.width/2 - this.halfsize;
      this.y = canvas.height/2 - this.halfsize;
    }
  }
}



var mrowka = [];
var mrowkacount;
for(mrowkacount=0; mrowkacount < liczbamrowek; mrowkacount++){
  let temp = new Mrowka(mrowkacount);
  temp.frame = makemrowka(temp.frame, temp.x, temp.y, temp.size, temp.halfsize, temp.direction);
  mrowka.push(temp);
}


var jedzonko = [];
var jedzonkocount;
for(jedzonkocount=0; jedzonkocount < liczbajedzonek; jedzonkocount++){
  let temp = new Jedzonko(jedzonkocount);
  makefood(temp.x, temp.y, temp.size, temp.color);
  jedzonko.push(temp); 
}

canvas2d.clearRect(0, 0, canvas.width, canvas.height);

renderstats();

window.addEventListener('mousedown', e => {
  if(clickmode == "follow"){
    following = true;  
    mrowka.forEach((mroweczka) =>{
      if(mroweczka.state != 'followc'){
        mroweczka.oldstate = mroweczka.state;
      }
    });
    mrowka.forEach(mroweczka => mroweczka.state = 'followc');
    mrowka.forEach(mroweczka => mroweczka.pointx = e.offsetX);
    mrowka.forEach(mroweczka => mroweczka.pointy = e.offsetY);
  }
  
  if(clickmode == "spawnfood"){
    spawningfood = true;
  }
});

window.addEventListener('mousemove', e => {
  if(clickmode == "follow" && following){
    mrowka.forEach((mroweczka) =>{
      if(mroweczka.state != 'followc'){
        mroweczka.oldstate = mroweczka.state;
      }
    });
    mrowka.forEach(mroweczka => {
      mroweczka.state = 'followc'
      mroweczka.pointx = e.offsetX
      mroweczka.pointy = e.offsetY
    });
  }
  
  if(clickmode == "spawnfood" && spawningfood == true){
    mousex = e.offsetX;
    mousey = e.offsetY;
  }
});

window.addEventListener('mouseup', e => {
  if (clickmode == "follow" && following) {
    following = false;
    mrowka.forEach(mroweczka => mroweczka.state = mroweczka.oldstate);
  }
  
  if(clickmode == "spawnfood" && spawningfood == true){
    spawningfood = false;
  }
});