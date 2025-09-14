
class SceneFrame {
  constructor() {
    // TV noise 
    this.noiseTile = createGraphics(320, 220);
    this.noiseAlphaBase = 36;

    // Distortion scratch
    this.fx = createGraphics(CANVAS_W, CANVAS_H);
    this.t = 0;
    this.distorting = false;
    this.distortEnd = 0;
    this.distortInterval = 3.0;  
    this.distortDuration  = 0.5; 
    this.blurAmt = 3;
    this.nextDistort = this._nextTime(0);

    // State
    this.broken = false;      
    this.drawRect = { x:0, y:0, w:0, h:0 }; 
  }

  _nextTime(offset){ return this.t + this.distortInterval + random(-0.4, 0.4) + offset; }

  _updateNoiseTile(alpha){
    const g = this.noiseTile;
    g.loadPixels();
    for (let i = 0; i < g.pixels.length; i += 4) {
      const v = random(30, 225);
      g.pixels[i]   = v;
      g.pixels[i+1] = v;
      g.pixels[i+2] = v;
      g.pixels[i+3] = alpha;
    }
    g.updatePixels();
  }

  update(dt = 0){
    this.t += dt;

    // stronger base noise 
    const noiseA = this.broken ? this.noiseAlphaBase + 24 : this.noiseAlphaBase;
    this._updateNoiseTile(noiseA);

    // faster/longer bursts 
    const burstInterval = this.broken ? 2.0 : this.distortInterval;
    const burstDuration = this.broken ? 0.85 : this.distortDuration;

    if (!this.distorting && this.t >= this.nextDistort){
      this.distorting = true;
      this.distortEnd = this.t + burstDuration;
    }
    if (this.distorting && this.t >= this.distortEnd){
      this.distorting = false;
      this.nextDistort = this.t + burstInterval + random(-0.3, 0.3);
    }
  }

  draw(g){
    g.clear();

    const f1 = ASSETS.images.frame1;
    const f2 = ASSETS.images.frame2;
    const f3 = ASSETS.images.frame3;

    // choose base image
    const baseImg = this.broken ? f3 : f1;

    let x = 0, y = 0, w = 0, h = 0;
    if (baseImg && baseImg.width){
      w = baseImg.width; h = baseImg.height;
      x = (CANVAS_W - w) * 0.5;
      y = (CANVAS_H - h) * 0.5;
      g.image(baseImg, x, y);
      this.drawRect = { x, y, w, h };
    } else {
      g.background(12);
      g.fill(220); g.textAlign(CENTER, CENTER); g.textSize(32);
      g.text('Loading Frame images…', CANVAS_W/2, CANVAS_H/2);
      return;
    }

    // UV reveal
    if (!this.broken && f2 && f2.width && uvOn){
      const p = toScene(mouseX, mouseY);
      const side = uvSize / coverScale;
      const rx = p.x - side/2;
      const ry = p.y - side/2;

      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, side, side); ctx.clip();
  
      g.image(f2, x, y);
      ctx.restore();

      // UV red box
      g.noStroke(); g.fill(255,30,30,60); g.rect(rx, ry, side, side);
      g.noFill(); g.stroke(255,60,60,220); g.strokeWeight(2);
      g.rect(rx+0.5, ry+0.5, side-1, side-1);
    }

    // TV noise 
    this._drawTVNoise(g);

    // Periodic distortion 
    if (this.distorting) this._applyDistortion(g, this.broken);

    // Continuous color glitch layers 
    if (this.broken) this._drawBrokenColorGlitch(g);

    // Occasional red flash 
    if (this.broken && random() < 0.05){
      g.noStroke();
      g.fill(255, 30, 30, 60);
      g.rect(0, 0, CANVAS_W, CANVAS_H);
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
    // snapshot
    this.fx.clear();
    this.fx.image(g, 0, 0);

    // blur strength & slice params
    const blurAmt = strong ? 6 : this.blurAmt;
    const bands   = strong ? 24 : 14;
    const amp     = strong ? 28 : 10;

    this.fx.filter(BLUR, blurAmt);

    let y = 0;
    for (let i=0; i<bands; i++){
      const h = random(8, 32);
      const hClamped = (y + h > CANVAS_H) ? (CANVAS_H - y) : h;
      if (hClamped <= 0) break;
      const dx = random(-amp, amp);
      const dy = random(-2, 2);
      const slice = this.fx.get(0, y, CANVAS_W, hClamped);
      g.image(slice, dx, y + dy);
      y += h;
    }

    // extra wobble 
    if (strong && random() < 0.45){
      const wobble = 0.006;
      const cx = CANVAS_W/2, cy = CANVAS_H/2;
      const ctx = g.drawingContext;
      ctx.save(); ctx.translate(cx,cy); ctx.scale(1+wobble,1+wobble); ctx.translate(-cx,-cy);
      g.push(); g.tint(255, 110); g.image(this.fx, 0, 0); g.pop();
      ctx.restore();
    }
  }

  _drawBrokenColorGlitch(g){
    // RGB split passes
    const w = this.noiseTile.width, h = this.noiseTile.height;
    const dx = random(-4,4), dy = random(-3,3);

    for (let yy = 0; yy < CANVAS_H; yy += h){
      for (let xx = 0; xx < CANVAS_W; xx += w){
        g.push(); g.tint(255,60,60,65);  g.image(this.noiseTile, xx+dx, yy+dy); g.pop();
        g.push(); g.tint(80,255,255,55); g.image(this.noiseTile, xx-dx, yy-dy); g.pop();
      }
    }

    // horizontal color bars
    const bars = int(random(3,7));
    for (let i=0; i<bars; i++){
      const y = random(0, CANVAS_H);
      const hbar = random(2, 10);
      const c = random([
        color(255,60,60,150),  
        color(80,255,255,130), 
        color(255,220,80,140)  
      ]);
      g.noStroke(); g.fill(c); g.rect(0, y, CANVAS_W, hbar);
    }
  }

  // interactions
  keyPressed(k){
    if (keyCode === ENTER) {
      manager.goTo(SCENE.ROOM);
    }
  }

  mousePressed(mx, my){
    if (this._inRect(mx, my, this.drawRect)){
      this.broken = !this.broken;
    }
  }

  _inRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
}
