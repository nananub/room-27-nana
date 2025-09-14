const CANVAS_W = 2360;
const CANVAS_H = 1640;

const ASSETS = {
  images: {
    home1: null, home2: null,
    room1: null, room2: null,
    frame1: null, frame2: null, frame3: null,
    clock1: null, clock2: null, clock3: null, clock4: null,
    book1: null, book2: null, book3: null, book4: null, book5: null, book6: null,
    bed1: null, bed2: null,
    soundOn: null, soundOff: null
  },
  audio: {
    bgm: null,      
    toggleA: null,  
    toggleD: null,  
    bookTurn: null  
  }
};

function preloadAssets(){
  // ---- SFX formats ----
  soundFormats('mp3','wav','ogg');

  // ---- IMAGES ----
  ASSETS.images.home1 = loadImage('assets/images/Home1.png',
    () => console.log('[img] Home1 loaded'),
    e  => console.error('[img] Home1 FAILED', e));

  ASSETS.images.home2 = loadImage('assets/images/Home2.png',
    () => console.log('[img] Home2 loaded'),
    e  => console.error('[img] Home2 FAILED', e));

  ASSETS.images.room1 = loadImage('assets/images/Room1.png',
    () => console.log('[img] Room1 loaded'),
    e  => console.error('[img] Room1 FAILED', e));

  ASSETS.images.room2 = loadImage('assets/images/Room2.png',
    () => console.log('[img] Room2 loaded'),
    e  => console.error('[img] Room2 FAILED', e));

  ASSETS.images.frame1 = loadImage('assets/images/Frame1.png');
  ASSETS.images.frame2 = loadImage('assets/images/Frame2.png');
  ASSETS.images.frame3 = loadImage('assets/images/Frame3.png');

  ASSETS.images.clock1 = loadImage('assets/images/Clock1.png');
  ASSETS.images.clock2 = loadImage('assets/images/Clock2.png');
  ASSETS.images.clock3 = loadImage('assets/images/Clock3.png');
  ASSETS.images.clock4 = loadImage('assets/images/Clock4.png');

  ASSETS.images.bed1 = loadImage('assets/images/Bed1.png');
  ASSETS.images.bed2 = loadImage('assets/images/Bed2.png');

  ASSETS.images.book1 = loadImage('assets/images/Book1.png');
  ASSETS.images.book2 = loadImage('assets/images/Book2.png');
  ASSETS.images.book3 = loadImage('assets/images/Book3.png');
  ASSETS.images.book4 = loadImage('assets/images/Book4.png');
  ASSETS.images.book5 = loadImage('assets/images/Book5.png');
  ASSETS.images.book6 = loadImage('assets/images/Book6.png');

  ASSETS.images.soundOn = loadImage('assets/images/sound-icon1.png',
    () => console.log('[img] sound-icon1 loaded'),
    e  => console.error('[img] sound-icon1 FAILED', e));

  ASSETS.images.soundOff = loadImage('assets/images/sound-icon2.png',
    () => console.log('[img] sound-icon2 loaded'),
    e  => console.error('[img] sound-icon2 FAILED', e));

  // ---- SFX ----
  ASSETS.audio.toggleD = loadSound('assets/audios/toggle1.mp3',
    () => console.log('[sfx] toggle1 loaded'),
    e  => console.error('[sfx] toggle1 FAILED', e));

  ASSETS.audio.toggleA = loadSound('assets/audios/toggle2.mp3',
    () => console.log('[sfx] toggle2 loaded'),
    e  => console.error('[sfx] toggle2 FAILED', e));

  ASSETS.audio.bookTurn = loadSound('assets/audios/book-turn.mp3',
    () => console.log('[sfx] book-turn loaded'),
    e  => console.error('[sfx] book-turn FAILED', e));
}
