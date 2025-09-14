// sketch.js — Room 27 

let manager, gScene;
let coverScale = 1, coverOX = 0, coverOY = 0;

// UV cursor (screen-space size; scenes convert to canvas-space)
let uvOn = false;
let uvSize = 180;                 
const UV_MIN = 80, UV_MAX = 520;  

// music toggle 
const ICON_SIZE = 48;
const ICON_MARGIN = 24;
let musicOn = false;

// CTA style
const CTA_MARGIN = 24;
const CTA_PAD_X = 16;
const CTA_PAD_Y = 10;
const CTA_COLOR = '#917409';
const CTA_TEXT  = 'Press Space to begin';
const CTA_FONT  = 'Oswald';

function preload(){ preloadAssets(); }

function setup(){
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  gScene = createGraphics(CANVAS_W, CANVAS_H);
  manager = new SceneManager();

  // BGM 
  ASSETS.audio.bgm = createAudio('assets/audios/Odd Behavior - low vision..mp3');
  ASSETS.audio.bgm.loop();
  ASSETS.audio.bgm.volume(0.35);
  ASSETS.audio.bgm.hide();
  ASSETS.audio.bgm.pause();
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

function draw(){
  background(0);

 
  manager.update(deltaTime/1000);
  manager.draw(gScene);

  
  coverScale = max(width / CANVAS_W, height / CANVAS_H);
  const dw = CANVAS_W * coverScale;
  const dh = CANVAS_H * coverScale;
  coverOX = (width - dw) * 0.5;
  coverOY = (height - dh) * 0.5;

 
  image(gScene, coverOX, coverOY, dw, dh);

  // ---- MUSIC ICON  ----
  const { ix, iy } = visibleCanvasTopRight(dw, dh);
  const iconImg = musicOn ? ASSETS.images.soundOn : ASSETS.images.soundOff;

  const over = isOverRect(mouseX, mouseY, ix, iy, ICON_SIZE, ICON_SIZE);
  if (over){ noStroke(); fill(0,120); rect(ix-6, iy-6, ICON_SIZE+12, ICON_SIZE+12, 8); }

  if (iconImg && iconImg.width) image(iconImg, ix, iy, ICON_SIZE, ICON_SIZE);
  else { noStroke(); fill(255,40); rect(ix, iy, ICON_SIZE, ICON_SIZE, 6); }

  // ---- Text overlays ----
  // ---- Text overlays ----
// ---- Text overlays ----
if (manager.current === SCENE.HOME) {
  drawCTA(dw, dh);              // title page only
} else {
  drawRoomHints(dw, dh);        // every other scene
}


  

  // cursor
  if (uvOn) noCursor(); else cursor(ARROW);
}

// CTA bottom-right 
function drawCTA(dw, dh){
  const vis = visibleCanvasRect(dw, dh);

  const fs = 18;
  textFont(CTA_FONT);
  textSize(fs);
  textAlign(LEFT, CENTER);

  const tw = textWidth(CTA_TEXT);
  const bw = tw + CTA_PAD_X * 2;
  const bh = fs + CTA_PAD_Y * 2;

  const bx = vis.x + vis.w - CTA_MARGIN - bw;
  const by = vis.y + vis.h - CTA_MARGIN - bh;

  noFill();
  stroke(CTA_COLOR);
  strokeWeight(2);
  rect(bx, by, bw, bh, 10);

  noStroke();
  fill(CTA_COLOR);
  text(CTA_TEXT, bx + CTA_PAD_X, by + bh/2);
}

// ROOM hint trio 
function drawRoomHints(dw, dh){
  const vis = visibleCanvasRect(dw, dh);

  const fs = 18;
  const padX = 16, padY = 10;
  const margin = CTA_MARGIN;
  const colorHex = CTA_COLOR;
  const font = CTA_FONT;

  const texts = [
    'Press A, D keys to inspect',
    'Press W, S keys to adjust',
    'Press Enter to exit'
  ];

  textFont(font);
  textSize(fs);
  textAlign(LEFT, CENTER);

  // common height
  const bh = fs + padY * 2;
  const by = vis.y + vis.h - margin - bh;

  // widths
  const w0 = textWidth(texts[0]) + padX*2;
  const w1 = textWidth(texts[1]) + padX*2;
  const w2 = textWidth(texts[2]) + padX*2;

  // positions: left, centered, right 
  const bx0 = vis.x + margin;
  const bx1 = vis.x + (vis.w - w1) / 2;
  const bx2 = vis.x + vis.w - margin - w2;

  drawHollowBox(bx0, by, w0, bh, texts[0], colorHex);
  drawHollowBox(bx1, by, w1, bh, texts[1], colorHex);
  drawHollowBox(bx2, by, w2, bh, texts[2], colorHex);
}

// hollow box renderer 
function drawHollowBox(x, y, w, h, label, colorHex){
  noFill();
  stroke(colorHex);
  strokeWeight(2);
  rect(x, y, w, h, 10);

  noStroke();
  fill(colorHex);
  text(label, x + CTA_PAD_X, y + h/2);
}

// map browser coords
function toScene(x, y){ return { x:(x-coverOX)/coverScale, y:(y-coverOY)/coverScale }; }

function mousePressed(){
  // icon click first
  const dw = CANVAS_W * coverScale;
  const dh = CANVAS_H * coverScale;
  const { ix, iy } = visibleCanvasTopRight(dw, dh);

  if (isOverRect(mouseX, mouseY, ix, iy, ICON_SIZE, ICON_SIZE)){
    toggleMusic();
    return;
  }
  const p = toScene(mouseX, mouseY);
  manager.mousePressed(p.x, p.y);
}

function keyPressed(){
  // ensure audio context 
  if (getAudioContext && getAudioContext()) {
    try { userStartAudio(); getAudioContext().resume(); } catch(e){}
  }

  const k = (key || '').toLowerCase();

  // UV controls + SFX
  if (k === 'a'){
    uvOn = false;
    const s = ASSETS.audio.toggleA;
    if (s && s.isLoaded()){
      s.stop();            
      s.setVolume(1.2);    
      s.rate(1.0);
      s.play();
    }
  }
  if (k === 'd'){
    uvOn = true;
    const s = ASSETS.audio.toggleD;
    if (s && s.isLoaded()){
      s.stop();
      s.setVolume(1.2);
      s.rate(1.0);
      s.play();
    }
  }

  if (k === 'w') uvSize = constrain(uvSize + 24, UV_MIN, UV_MAX);
  if (k === 's') uvSize = constrain(uvSize - 24, UV_MIN, UV_MAX);

  // scene switching
  if (k === ' ' && manager.current === SCENE.HOME) manager.goTo(SCENE.ROOM);
  if (keyCode === ENTER && manager.current === SCENE.ROOM) manager.goTo(SCENE.HOME);

  manager.keyPressed(key);
}

// ---------- helpers ----------
function visibleCanvasTopRight(dw, dh){
  const vis = visibleCanvasRect(dw, dh);
  return { ix: vis.x + vis.w - ICON_MARGIN - ICON_SIZE, iy: vis.y + ICON_MARGIN };
}
function visibleCanvasRect(dw, dh){
  const x0 = max(coverOX, 0), y0 = max(coverOY, 0);
  const x1 = min(coverOX + dw, width), y1 = min(coverOY + dh, height);
  return { x:x0, y:y0, w:x1-x0, h:y1-y0 };
}
function isOverRect(mx, my, x, y, w, h){
  return mx>=x && mx<=x+w && my>=y && my<=y+h;
}
function toggleMusic(){
  if (!ASSETS.audio.bgm) return;
  if (musicOn){ ASSETS.audio.bgm.pause(); musicOn = false; }
  else { ASSETS.audio.bgm.play(); musicOn = true; }
}
