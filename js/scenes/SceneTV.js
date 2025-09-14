

class SceneTV {
  constructor() {
    // TV static
    this.noiseTile = createGraphics(320, 220);
    this.noiseAlpha = 36;

    // Distortion
    this.fx = createGraphics(CANVAS_W, CANVAS_H);
    this.t = 0;
    this.distorting = false;
    this.distortEnd = 0;
    this.distortInterval = 3.0;
    this.distortDuration  = 0.5;
    this.blurAmt = 3;
    this.nextDistort = this._nextTime(0);

    // Videos 
    this.v1 = this._makeVideo('assets/images/TV1.mov'); 
    this.v2 = this._makeVideo('assets/images/TV2.mov'); 
    this.v3 = this._makeVideo('assets/images/TV3.mov'); 
    this.v4 = this._makeVideo('assets/images/TV4.mov'); 
    this.v5 = this._makeVideo('assets/images/TV5.mov'); 
    this.v6 = this._makeVideo('assets/images/TV6.mov'); 

    [this.v1, this.v2, this.v3, this.v4, this.v5, this.v6].forEach(v => v.loop());

    this.activePair = 0;

    this.clickSfx = createAudio('assets/audios/TVsound.mp3');
    this.clickSfx.hide();
    this.clickSfx.volume(0.8);

    this.drawRect = { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
  }

  _makeVideo(path) {
    const v = createVideo(path);
    v.attribute('playsinline', '');
    v.elt.muted = true;  
    v.volume(0);
    v.hide();
    return v;
  }

  _nextTime(offset){ return this.t + this.distortInterval + random(-0.4, 0.4) + offset; }

  _updateNoiseTile(){
    const g = this.noiseTile;
    g.loadPixels();
    for (let i = 0; i < g.pixels.length; i += 4) {
      const v = random(30, 225);
      g.pixels[i] = v; g.pixels[i+1] = v; g.pixels[i+2] = v; g.pixels[i+3] = this.noiseAlpha;
    }
    g.updatePixels();
  }

  update(dt = 0){
    this.t += dt;
    this._updateNoiseTile();

    if (!this.distorting && this.t >= this.nextDistort){
      this.distorting = true;
      this.distortEnd = this.t + this.distortDuration;
    }
    if (this.distorting && this.t >= this.distortEnd){
      this.distorting = false;
      this.nextDistort = this._nextTime(0);
    }
  }

  draw(g){
    g.clear();

    // pick the current pair
    const base = [this.v1, this.v3, this.v5][this.activePair];
    const uv   = [this.v2, this.v4, this.v6][this.activePair];

    // base video — full canvas
    g.image(base, 0, 0, CANVAS_W, CANVAS_H);

    // UV reveal
    if (uvOn){
      const scenePos = toScene(mouseX, mouseY);
      const side = uvSize / coverScale;
      const rx = scenePos.x - side/2;
      const ry = scenePos.y - side/2;

      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, side, side); ctx.clip();
      g.image(uv, 0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      // red frame
      g.noStroke(); g.fill(255,30,30,60); g.rect(rx, ry, side, side);
      g.noFill(); g.stroke(255,60,60,220); g.strokeWeight(2);
      g.rect(rx+0.5, ry+0.5, side-1, side-1);
    }

    // TV static
    this._drawTVNoise(g);

    // distortion
    if (this.distorting) this._applyDistortion(g);

    // Pair 2 tint 
    if (this.activePair === 2) {
      g.noStroke();
      g.fill(0, 90);                 
      g.rect(0, 0, CANVAS_W, CANVAS_H);
      g.fill(255, 30, 30, 45);       
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

  _applyDistortion(g){
    this.fx.clear();
    this.fx.image(g, 0, 0);
    this.fx.filter(BLUR, this.blurAmt);

    const bands = 14, amp = 10;
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

  // interactions
  keyPressed(k){
    if (keyCode === ENTER) {
      this.clickSfx.stop();
      // Pause all videos when exiting this scene
      [this.v1, this.v2, this.v3, this.v4, this.v5, this.v6].forEach(v => v.pause());
      manager.goTo(SCENE.ROOM);
    }
  }

  mousePressed(mx, my){
    if (this._inRect(mx, my, this.drawRect)){
      
      [this.v1, this.v2, this.v3, this.v4, this.v5, this.v6].forEach(v => { if (v.elt.paused) v.play(); });

      
      this.activePair = (this.activePair + 1) % 3;

      // one-shot click SFX
      this.clickSfx.stop();
      this.clickSfx.play();
    }
  }

  _inRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
}
