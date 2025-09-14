// SceneManager.js
const SCENE = {
  HOME:  'HOME',
  ROOM:  'ROOM',
  TV:    'TV',
  FRAME: 'FRAME',
  BED:   'BED',
  CLOCK: 'CLOCK'
};

class SceneManager {
  constructor() {
    this.current = SCENE.HOME;
    this.scenes = {
      [SCENE.HOME]:  new SceneHome(),
      [SCENE.ROOM]:  new SceneRoom(),
      [SCENE.TV]:    new SceneTV(),
      [SCENE.FRAME]: new SceneFrame(),
      [SCENE.BED]:   new SceneBed(),
      [SCENE.CLOCK]: new SceneClock()
    };
  }

  goTo(next)              { if (this.scenes[next]) this.current = next; }
  update(dt)              { this.scenes[this.current]?.update?.(dt); }
  draw(g)                 { this.scenes[this.current]?.draw?.(g); }
  keyPressed(k)           { this.scenes[this.current]?.keyPressed?.(k); }
  mousePressed(x, y)      { this.scenes[this.current]?.mousePressed?.(x, y); }
}
