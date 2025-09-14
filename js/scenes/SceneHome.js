class SceneHome {
  constructor() {
    this.noiseTile = createGraphics(320, 220);
    this.noiseAlpha = 36;

    this.vignette = createGraphics(CANVAS_W, CANVAS_H);
    this._buildSoftVignette(72, 90); 
  }

  _buildSoftVignette(borderPx = 72, maxA = 90) {
    const g = this.vignette;
    g.clear();
    g.noFill();
    for (let i = 0; i < borderPx; i++) {
      const a = map(i, 0, borderPx - 1, 0, maxA);
      g.stroke(0, a);
      g.strokeWeight(1);
      g.rect(i, i, CANVAS_W - 2 * i, CANVAS_H - 2 * i, 16);
    }
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

  update() { this._updateNoiseTile(); }

  draw(g) {
    g.clear();

    const img1 = ASSETS.images.home1;
    const img2 = ASSETS.images.home2;

    // center coords 
    let x = 0, y = 0;
    if (img1 && img1.width) {
      x = (CANVAS_W - img1.width) * 0.5;
      y = (CANVAS_H - img1.height) * 0.5;
      g.image(img1, x, y);
    } else {
      g.background(20);
      g.fill(255); g.textAlign(CENTER, CENTER); g.textSize(42);
      g.text('Home1.png not loaded', CANVAS_W/2, CANVAS_H/2);
    }

    // --- UV reveal ---
    if (uvOn && img2 && img2.width) {
      // convert screen-space mouse/size
      const scenePos = toScene(mouseX, mouseY);           
      const side = uvSize / coverScale;                   
      const rx = scenePos.x - side/2;
      const ry = scenePos.y - side/2;

      // clip to the UV rect 
      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, side, side);
      ctx.clip();

      g.image(img2, x, y);

      ctx.restore();

      // red overlay 
      g.noStroke();
      g.fill(255, 30, 30, 60);       
      g.rect(rx, ry, side, side);

      g.noFill();
      g.stroke(255, 60, 60, 220);    
      g.strokeWeight(2);
      g.rect(rx + 0.5, ry + 0.5, side - 1, side - 1);
    }

    // TV noise overlay 
    const w = this.noiseTile.width, h = this.noiseTile.height;
    for (let yy = 0; yy < CANVAS_H; yy += h) {
      for (let xx = 0; xx < CANVAS_W; xx += w) {
        g.image(this.noiseTile, xx + (random(-2,2)|0), yy + (random(-2,2)|0));
      }
    }

  }

  keyPressed() {}
  mousePressed() {}
}
