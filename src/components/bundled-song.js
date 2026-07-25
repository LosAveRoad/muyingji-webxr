const defaultBeatmap = require('../lib/default-beatmap.json');

AFRAME.registerComponent('bundled-song', {
  init: function () {
    this.onStart = this.onStart.bind(this);
    this.el.addEventListener('startgame', this.onStart);
  },

  onStart: function () {
    window.setTimeout(() => {
      defaultBeatmap._beatsPerMinute = 143;
      this.el.emit('ziploaderstart', null, false);
      this.el.emit('ziploaderend', {
        audio: 'assets/shadowplay/audio/xiakexing.mp3',
        beats: {
          'Standard-Normal': defaultBeatmap
        }
      }, false);
    }, 0);
  },

  remove: function () {
    this.el.removeEventListener('startgame', this.onStart);
  }
});
