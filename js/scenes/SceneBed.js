
class SceneBed {
  constructor() {
   
    this.noiseTile = createGraphics(320, 220);
    this.noiseAlpha = 36;

    
    this.fx = createGraphics(CANVAS_W, CANVAS_H);
    this.t = 0;
    this.distorting = false;
    this.distortEnd = 0;
    this.distortInterval = 3.0;
    this.distortDuration  = 0.5;
    this.blurAmt = 3;
    this.nextDistort = this._nextTime(0);

    // bed click bounds 
    this.bedRect = { x:0, y:0, w:0, h:0 };

    // overlay state
    this.overlayOpen = false;
    this.page = 0; 

    // overlay/book rect
    this.bookRect = { x:0, y:0, w:0, h:0 };

    // arrow UI
    this.arrowSize = 48;
    this.arrowPad  = 16;
    this.arrowColor = color('#917409');
    this.leftArrowRect  = { x:0, y:0, w:0, h:0 };
    this.rightArrowRect = { x:0, y:0, w:0, h:0 };
  }

  _ensureAudioReady(){
  try {
    if (typeof userStartAudio === 'function') userStartAudio();
    const ctx = (typeof getAudioContext === 'function') ? getAudioContext() : null;
    if (ctx && ctx.state !== 'running') ctx.resume();
  } catch(e) {  }
}


  _nextTime(offset){ return this.t + this.distortInterval + random(-0.4, 0.4) + offset; }

  _updateNoiseTile(alpha = this.noiseAlpha){
    const g = this.noiseTile;
    g.loadPixels();
    for (let i = 0; i < g.pixels.length; i += 4) {
      const v = random(30, 225);
      g.pixels[i] = v; g.pixels[i+1] = v; g.pixels[i+2] = v; g.pixels[i+3] = alpha;
    }
    g.updatePixels();
  }

  update(dt = 0){
    this.t += dt;

    // stronger base noise 
    const extra = (this.overlayOpen && this.page === 2) ? 20 : 0;
    this._updateNoiseTile(this.noiseAlpha + extra);

    // distortion bursts 
    const stronger = (this.overlayOpen && this.page === 2);
    const interval = stronger ? 2.2 : this.distortInterval;
    const duration = stronger ? 0.85 : this.distortDuration;

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

    // --- base bed image ---
    const b1 = ASSETS.images.bed1;
    const b2 = ASSETS.images.bed2;

    let x = 0, y = 0;
    if (b1 && b1.width){
      x = (CANVAS_W - b1.width) * 0.5;
      y = (CANVAS_H - b1.height) * 0.5;
      g.image(b1, x, y);
      this.bedRect = { x, y, w:b1.width, h:b1.height };
    } else {
      g.background(12);
      g.fill(220); g.textAlign(CENTER, CENTER); g.textSize(32);
      g.text('Bed1.png not loaded', CANVAS_W/2, CANVAS_H/2);
      return;
    }

    // --- UV reveal on bed ---
    if (!this.overlayOpen && uvOn && b2 && b2.width){
      const p = toScene(mouseX, mouseY);
      const side = uvSize / coverScale;
      const rx = p.x - side/2;
      const ry = p.y - side/2;

      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, side, side); ctx.clip();
      g.image(b2, x, y); 
      ctx.restore();

      // red overlay 
      g.noStroke(); g.fill(255,30,30,60); g.rect(rx, ry, side, side);
      g.noFill(); g.stroke(255,60,60,220); g.strokeWeight(2);
      g.rect(rx + 0.5, ry + 0.5, side - 1, side - 1);
    }

    // --- Book overlay ---
    if (this.overlayOpen){
      this._drawBookOverlay(g);
    }

    // --- TV noise overlay ---
    this._drawTVNoise(g);

    // --- periodic distortion ---
    const strong = (this.overlayOpen && this.page === 2);
    if (this.distorting) this._applyDistortion(g, strong);

    // extra darkening 
    if (this.overlayOpen && this.page === 2){
      g.noStroke();
      g.fill(0, 70); g.rect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  _drawBookOverlay(g){
    
    const pages = [
      { base: ASSETS.images.book1, uv: ASSETS.images.book2 },
      { base: ASSETS.images.book3, uv: ASSETS.images.book4 },
      { base: ASSETS.images.book5, uv: ASSETS.images.book6 }
    ];
    const set = pages[this.page] || pages[0];
    const baseImg = set.base;
    const uvImg   = set.uv;

    if (!(baseImg && baseImg.width)){
      
      const bw = CANVAS_W * 0.8, bh = CANVAS_H * 0.8;
      const bx = (CANVAS_W - bw) * 0.5;
      const by = (CANVAS_H - bh) * 0.5;
      this.bookRect = { x:bx, y:by, w:bw, h:bh };
      g.noFill(); g.stroke(255,80); g.rect(bx, by, bw, bh, 12);
      return;
    }

    // fit the book 
    const maxW = CANVAS_W * 0.8;
    const maxH = CANVAS_H * 0.8;
    const s = min(maxW / baseImg.width, maxH / baseImg.height);
    const bw = baseImg.width * s;
    const bh = baseImg.height * s;
    const bx = (CANVAS_W - bw) * 0.5;
    const by = (CANVAS_H - bh) * 0.5;
    this.bookRect = { x:bx, y:by, w:bw, h:bh };

    // draw base page
    g.image(baseImg, bx, by, bw, bh);

    // UV reveal 
    if (uvOn && uvImg && uvImg.width){
      const p = toScene(mouseX, mouseY);
      const side = uvSize / coverScale;
      const rx = p.x - side/2;
      const ry = p.y - side/2;

      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, side, side); ctx.clip();
      g.image(uvImg, bx, by, bw, bh);
      ctx.restore();

      // red UV box
      g.noStroke(); g.fill(255,30,30,60); g.rect(rx, ry, side, side);
      g.noFill(); g.stroke(255,60,60,220); g.strokeWeight(2);
      g.rect(rx+0.5, ry+0.5, side-1, side-1);
    }

    // arrows 
    const ay = by + (bh - this.arrowSize) * 0.5;
    this.leftArrowRect  = { x: bx + this.arrowPad,             y: ay, w: this.arrowSize, h: this.arrowSize };
    this.rightArrowRect = { x: bx + bw - this.arrowPad - this.arrowSize, y: ay, w: this.arrowSize, h: this.arrowSize };

    const m = toScene(mouseX, mouseY);
    const overL = this._inRect(m.x, m.y, this.leftArrowRect);
    const overR = this._inRect(m.x, m.y, this.rightArrowRect);

    // draw hollow boxes 
    this._drawArrow(g, this.leftArrowRect,  '‹', overL, this.page > 0);
    this._drawArrow(g, this.rightArrowRect, '›', overR, this.page < 2);
  }

  _drawArrow(g, r, label, hover, enabled){
    g.push();
    g.textAlign(CENTER, CENTER);
    g.textSize(32);
    g.textFont('Oswald');

    const a = enabled ? 255 : 120;
    const plate = hover && enabled ? 30 : 0;

    // plate
    g.noStroke(); g.fill(0, plate); g.rect(r.x-8, r.y-8, r.w+16, r.h+16, 10);

    // border
    g.noFill(); g.stroke(red(this.arrowColor), green(this.arrowColor), blue(this.arrowColor), a);
    g.strokeWeight(2); g.rect(r.x, r.y, r.w, r.h, 10);

    // label
    g.noStroke(); g.fill(red(this.arrowColor), green(this.arrowColor), blue(this.arrowColor), a);
    g.text(label, r.x + r.w/2, r.y + r.h/2);
    g.pop();
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
    // snapshot current frame
    this.fx.clear();
    this.fx.image(g, 0, 0);
    this.fx.filter(BLUR, strong ? 6 : this.blurAmt);

    const bands = strong ? 22 : 14;
    const amp   = strong ? 24 : 10;

    let y = 0;
    for (let i = 0; i < bands; i++){
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

  keyPressed(k){
    if (keyCode === ENTER) manager.goTo(SCENE.ROOM);
  }

  mousePressed(mx, my){
    if (!this.overlayOpen){
      // click to open book
      if (this._inRect(mx, my, this.bedRect)){
        this.overlayOpen = true;
        this.page = 0;
        return;
      }
      return;
    }

    // overlay open
    if (this._inRect(mx, my, this.bookRect)){
      // arrows
      if (this._inRect(mx, my, this.leftArrowRect) && this.page > 0){
        this.page--;
        this._playPageTurn();
        return;
      }
      if (this._inRect(mx, my, this.rightArrowRect) && this.page < 2){
        this.page++;
        this._playPageTurn();
        return;
      }
      // clicks on the page 
    } else {
      // clicked outside 
      this.overlayOpen = false;
    }
  }

  _playPageTurn(){
  this._ensureAudioReady();
  const s = ASSETS.audio.bookTurn;
  if (s && s.isLoaded && s.isLoaded()){
    s.playMode('restart');
    s.stop();                 
    s.setVolume(1.0);         
    s.play(0, 1.0, 1.0);      
  } else {
    console.warn('[sfx] book-turn not ready');
  }
}

  _inRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
}
