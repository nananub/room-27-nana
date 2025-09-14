
class SceneRoom {
  constructor() {
    // --- TV noise ---
    this.noiseTile = createGraphics(320, 220);
    this.noiseAlpha = 36;

    // --- Distortion FX ---
    this.fx = createGraphics(CANVAS_W, CANVAS_H);
    this.t = 0;                         
    this.distorting = false;
    this.distortEnd = 0;
    this.distortInterval = 3.0;         
    this.distortDuration = 0.50;        
    this.blurAmt = 3;
    this.nextDistort = this._jitteredNext(0.0);

    // --- Hotspots ---
    this.hotspots = [
      { id: 'TV',     cx: 360,  cy: 980,  rect:{ x:120,  y:820,  w:560, h:480 }, goto: () => manager.goTo(SCENE.TV) },
      { id: 'FRAME',  cx: 650,  cy: 500,  rect:{ x:650 - 280/2, y:500 - 220/2, w:280, h:220 }, goto: () => manager.goTo(SCENE.FRAME) },
      { id: 'BED',    cx: 1230, cy: 850,  rect:{ x:900,  y:760,  w:820, h:420 }, goto: () => manager.goTo(SCENE.BED) },
      { id: 'CLOCKS', cx: 2000, cy: 280,  rect:{ x:1780, y:160,  w:460, h:300 }, goto: () => manager.goTo(SCENE.CLOCK) }
    ];

    // Pulse/flicker animation
    this.pulse = 0;     
  }

  _jitteredNext(offset) {
    return this.t + this.distortInterval + random(-0.4, 0.4) + offset;
  }

  _updateNoiseTile() {
    const g = this.noiseTile;
    g.loadPixels();
    for (let i = 0; i < g.pixels.length; i += 4) {
      const v = random(30, 225);
      g.pixels[i]   = v;
      g.pixels[i+1] = v;
      g.pixels[i+2] = v;
      g.pixels[i+3] = this.noiseAlpha;
    }
    g.updatePixels();
  }

  update(dt = 0) {
    this.t += dt;
    this._updateNoiseTile();

    // pulse 
    this.pulse = (sin(this.t * 5.2) + 1) * 0.5;

    // schedule / advance distortion
    if (!this.distorting && this.t >= this.nextDistort) {
      this.distorting = true;
      this.distortEnd = this.t + this.distortDuration;
    }
    if (this.distorting && this.t >= this.distortEnd) {
      this.distorting = false;
      this.nextDistort = this._jitteredNext(0.0);
    }
  }

  draw(g) {
    g.clear();

    const img1 = ASSETS.images.room1;
    const img2 = ASSETS.images.room2;

    // surface
    let x = 0, y = 0;
    if (img1 && img1.width) {
      x = (CANVAS_W - img1.width) * 0.5;
      y = (CANVAS_H - img1.height) * 0.5;
      g.image(img1, x, y);
    } else {
      g.background(10);
      g.fill(220); g.textAlign(CENTER, CENTER); g.textSize(42);
      g.text('Room1.png not loaded', CANVAS_W/2, CANVAS_H/2);
    }

    // UV reveal 
    if (uvOn && img2 && img2.width) {
      const p = toScene(mouseX, mouseY);
      const side = uvSize / coverScale;
      const rx = p.x - side / 2;
      const ry = p.y - side / 2;

      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, side, side); ctx.clip();
      g.image(img2, x, y);
      ctx.restore();

      // red overlay
      g.noStroke(); g.fill(255, 30, 30, 60); g.rect(rx, ry, side, side);
      g.noFill(); g.stroke(255, 60, 60, 220); g.strokeWeight(2);
      g.rect(rx + 0.5, ry + 0.5, side - 1, side - 1);
    }

    // TV noise 
    this._drawTVNoise(g);

    // periodic distortion burst
    if (this.distorting) this._applyDistortion(g);

    // hotspot icons 
    this._drawHotspots(g);
  }

  _drawTVNoise(g) {
    const w = this.noiseTile.width, h = this.noiseTile.height;
    for (let yy = 0; yy < CANVAS_H; yy += h) {
      for (let xx = 0; xx < CANVAS_W; xx += w) {
        const jx = (random(-2, 2) | 0), jy = (random(-2, 2) | 0);
        g.image(this.noiseTile, xx + jx, yy + jy);
      }
    }
  }

  _applyDistortion(g) {
    this.fx.clear();
    this.fx.image(g, 0, 0);
    this.fx.filter(BLUR, this.blurAmt);

    const bands = 14, amp = 10;
    let y = 0;
    for (let i = 0; i < bands; i++) {
      const h = random(8, 28);
      const hClamped = (y + h > CANVAS_H) ? (CANVAS_H - y) : h;
      if (hClamped <= 0) break;
      const dx = random(-amp, amp);
      const dy = random(-1, 1);

      const slice = this.fx.get(0, y, CANVAS_W, hClamped);
      g.image(slice, dx, y + dy);
      y += h;
    }

    if (random() < 0.25) {
      const wobble = 0.004;
      const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
      const ctx = g.drawingContext;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + wobble, 1 + wobble); ctx.translate(-cx, -cy);
      g.push(); g.tint(255, 80); g.image(this.fx, 0, 0); g.pop();
      ctx.restore();
    }
  }

  _drawHotspots(g) {
    const gold = color('#917409');
    const p = toScene(mouseX, mouseY);

    for (const h of this.hotspots) {
      const hover = this._inRect(p.x, p.y, h.rect);
      const a = hover ? 255 : 190;
      const r = 18 + this.pulse * 6;        
      const ring = 4 + this.pulse * 2;

      // outer pulse
      g.noFill();
      g.stroke(red(gold), green(gold), blue(gold), a * 0.55);
      g.strokeWeight(ring);
      g.circle(h.cx, h.cy, r * 2);

      // inner dot
      g.noStroke();
      g.fill(red(gold), green(gold), blue(gold), a);
      g.circle(h.cx, h.cy, 8 + this.pulse * 3);

      // subtle flicker 
      if (random() < 0.07) {
        g.noStroke();
        g.fill(red(gold), green(gold), blue(gold), 50);
        g.circle(h.cx + random(-2, 2), h.cy + random(-2, 2), 6);
      }
    }
  }

  _inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  keyPressed(k) {
    // Enter → back to Home
    if (keyCode === ENTER) manager.goTo(SCENE.HOME);
  }

  mousePressed(mx, my) {
    for (const h of this.hotspots) {
      if (this._inRect(mx, my, h.rect)) {
        h.goto();
        return;
      }
    }
  }
}
