
class SceneClock {
  constructor() {
   
    this.noiseTile = createGraphics(320, 220);
    this.noiseAlpha = 36;

    
    this.fx = createGraphics(CANVAS_W, CANVAS_H);        
    this.twirlLayer = createGraphics(CANVAS_W, CANVAS_H); 

    // time & distortion 
    this.t = 0;
    this.distorting = false;
    this.distortEnd = 0;
    this.distortInterval = 3.0;
    this.distortDuration  = 0.5;
    this.blurAmt = 3;
    this.nextDistort = this._nextTime(0);

    // state
    this.mode = 0; 
    this.drawRect = { x:0, y:0, w:0, h:0 }; 
  }

  _nextTime(offset){ return this.t + this.distortInterval + random(-0.4, 0.4) + offset; }

  _updateNoiseTile(){
    const g = this.noiseTile;
    g.loadPixels();
    for (let i = 0; i < g.pixels.length; i += 4) {
      const v = random(30, 225);
      g.pixels[i]   = v;
      g.pixels[i+1] = v;
      g.pixels[i+2] = v;
      g.pixels[i+3] = this.noiseAlpha + (this.mode===2 ? 12 : 0);
    }
    g.updatePixels();
  }

  update(dt = 0){
    this.t += dt;
    this._updateNoiseTile();

    // stronger/longer bursts 
    const interval = (this.mode===2) ? 2.2 : this.distortInterval;
    const duration = (this.mode===2) ? 0.85 : this.distortDuration;

    if (!this.distorting && this.t >= this.nextDistort){
      this.distorting = true;
      this.distortEnd = this.t + duration;
    }
    if (this.distorting && this.t >= this.distortEnd){
      this.distorting = false;
      this.nextDistort = this.t + interval + random(-0.3, 0.3);
    }
  }

  draw(g){
    g.clear();

    const c1 = ASSETS.images.clock1;
    const c2 = ASSETS.images.clock2;
    const c3 = ASSETS.images.clock3;
    const c4 = ASSETS.images.clock4; 

    const baseImg = (this.mode===0) ? c1 : (this.mode===1) ? c2 : c3;

    let x=0, y=0, w=0, h=0;
    if (baseImg && baseImg.width){
      w = baseImg.width; h = baseImg.height;
      x = (CANVAS_W - w) * 0.5;
      y = (CANVAS_H - h) * 0.5;
      g.image(baseImg, x, y);
      this.drawRect = { x, y, w, h };
    } else {
      g.background(10);
      g.fill(220); g.textAlign(CENTER,CENTER); g.textSize(32);
      g.text('Loading Clock images…', CANVAS_W/2, CANVAS_H/2);
      return;
    }

    // --- UV box ---
    if (uvOn){
      const p = toScene(mouseX, mouseY);
      const side = uvSize / coverScale;
      const rx = p.x - side/2;
      const ry = p.y - side/2;

      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, side, side); ctx.clip();

      if (this.mode === 2 && c4 && c4.width) {
        g.image(c4, x, y);
      } else {
    
        g.image(baseImg, x, y);
      }
      ctx.restore();

      // red frame
      g.noStroke(); g.fill(255,30,30,60); g.rect(rx, ry, side, side);
      g.noFill(); g.stroke(255,60,60,220); g.strokeWeight(2);
      g.rect(rx+0.5, ry+0.5, side-1, side-1);
    }

    // static
    this._drawTVNoise(g);

    // periodic distortion 
    if (this.distorting) this._applyDistortion(g, this.mode===2);

    // spiral/twirl 
    if (this.mode === 2) {
      this._applyOppositeTwirl(g);
      this._brokenColorFringe(g); 
    }
  }

  _drawTVNoise(g){
    const w = this.noiseTile.width, h = this.noiseTile.height;
    for (let yy = 0; yy < CANVAS_H; yy += h){
      for (let xx = 0; xx < CANVAS_W; xx += w){
        const jx = (random(-2,2)|0), jy = (random(-2,2)|0);
        g.image(this.noiseTile, xx + jx, yy + jy);
      }
    }
  }

  _applyDistortion(g, strong=false){
    this.fx.clear();
    this.fx.image(g, 0, 0);

    const blurAmt = strong ? 6 : this.blurAmt;
    const bands   = strong ? 22 : 14;
    const amp     = strong ? 24 : 10;

    this.fx.filter(BLUR, blurAmt);

    let y = 0;
    for (let i=0; i<bands; i++){
      const h = random(8, 28);
      const hClamped = (y + h > CANVAS_H) ? (CANVAS_H - y) : h;
      if (hClamped <= 0) break;
      const dx = random(-amp, amp);
      const dy = random(-1, 1);
      const slice = this.fx.get(0, y, CANVAS_W, hClamped);
      g.image(slice, dx, y + dy);
      y += h;
    }
  }

  _applyOppositeTwirl(g){
    const tl = this.twirlLayer;
    tl.clear();

    // snapshot scene
    this.fx.clear();
    this.fx.image(g, 0, 0);

    const c = { x: CANVAS_W * 0.5, y: CANVAS_H * 0.5 };
    const m = toScene(mouseX, mouseY);
    const mx = m.x, my = m.y;

    // choose direction 
    const dir = (mx >= c.x) ? -1 : +1; 

    // parameters
    const t = this.t;
    const baseAmp = 28;         
    const swirlK  = 0.010 * dir; 
    const waveF   = 0.035;
    const waveS   = 2.6;

    const stepY = 4;
    for (let y = 0; y < CANVAS_H; y += stepY){
      const row = this.fx.get(0, y, CANVAS_W, stepY);

      // stronger away from cursor
      const distToCursor = dist(CANVAS_W * 0.5, y + stepY*0.5, mx, my);
      const maxD = Math.hypot(CANVAS_W, CANVAS_H) * 0.5;
      const falloff = constrain(distToCursor / maxD, 0, 1);

      // swirl + sine wobble
      const rotTerm = (y - c.y) * swirlK;
      const sinTerm = Math.sin(y * waveF + t * waveS);
      const offsetX = (baseAmp * falloff) * (rotTerm + sinTerm);

      tl.image(row, offsetX, y);
    }

    // circular clear region around the cursor
    const holeR = uvOn ? max(120, uvSize * 0.55) : 140;
    const ctx = tl.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(mx, my, holeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // blend the twirl 
    g.push(); g.tint(255, 210); g.image(tl, 0, 0); g.pop();
  }

  _brokenColorFringe(g){
    const w = this.noiseTile.width, h = this.noiseTile.height;
    const dx = random(-3,3), dy = random(-2,2);
    for (let yy = 0; yy < CANVAS_H; yy += h){
      for (let xx = 0; xx < CANVAS_W; xx += w){
        g.push(); g.tint(255,60,60,55);  g.image(this.noiseTile, xx+dx, yy+dy); g.pop();
        g.push(); g.tint(80,255,255,45); g.image(this.noiseTile, xx-dx, yy-dy); g.pop();
      }
    }
    if (random() < 0.04){
      g.noStroke(); g.fill(255,30,30,45); g.rect(0,0, CANVAS_W, CANVAS_H);
    }
  }

  // interactions
  keyPressed(k){
    if (keyCode === ENTER) manager.goTo(SCENE.ROOM);
  }

  mousePressed(mx, my){
    if (this._inRect(mx, my, this.drawRect)){
      
      this.mode = (this.mode + 1) % 3;
    }
  }

  _inRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
}
