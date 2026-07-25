const sourceBeatmap = require('../lib/default-beatmap.json');
const defaultBeatmap = Object.assign({}, sourceBeatmap, {
  // 幕影记只保留可击打音符。原谱面的整轨墙体和炸弹会遮挡舞台，
  // 并可能让经典模式保持在 wall-hit 状态。
  _obstacles: [],
  _notes: (sourceBeatmap._notes || []).filter(note => note._type === 0 || note._type === 1)
});

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
