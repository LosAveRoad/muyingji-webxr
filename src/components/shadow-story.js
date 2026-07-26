const STORY = [
  // 第一幕底景在开演时作为舞台基底就位；此后每一项严格对应一次击打。
  ['act1bg', 'perform'],
  ['garden', 'enter'], ['garden', 'perform'],

  // 第一幕：侠客入园，发现密函。
  ['hero', 'enter'], ['desk', 'enter'], ['hero', 'walk'],
  ['desk', 'perform'], ['hero', 'hi'], ['desk', 'exit'], ['garden', 'exit'],
  ['act1bg', 'exit'],

  // 第二幕：强敌现身，追逐交锋。
  ['act2bg', 'enter'], ['act2bg', 'perform'], ['rock', 'enter'],
  ['villain', 'enter'], ['villain', 'hi'], ['hero', 'run'],
  ['villain', 'run'], ['hero', 'exit'],

  // 第三幕：女将从月下赶来，三人决战。
  ['general', 'enter'], ['general', 'flying'], ['hero', 'hi'],
  ['villain', 'hi'], ['general', 'run'], ['villain', 'exit'], ['rock', 'exit'],
  ['act2bg', 'exit'], ['act3bg', 'enter'], ['act3bg', 'perform'],

  // 尾声：老者揭示密函，众人离场，舞台收卷。
  ['elder', 'enter'], ['hero', 'enter'], ['elder', 'hi'], ['hero', 'hi'],
  ['general', 'hi'], ['elder', 'exit'], ['general', 'exit'],
  ['hero', 'exit'], ['act3bg', 'exit']
];

const OFFSTAGE = {
  left: new THREE.Vector3(-7.4, -0.7, 0),
  right: new THREE.Vector3(7.4, -0.7, 0),
  down: new THREE.Vector3(0, -5.4, 0)
};

AFRAME.registerComponent('shadow-story', {
  init: function () {
    this.step = 0;
    this.performance = [];
    this.reviewIndex = 0;
    this.reviewAudio = new Audio('assets/shadowplay/audio/xiakexing.mp3');
    this.reviewAudio.preload = 'auto';
    this.assets = {};
    Array.from(this.el.querySelectorAll('.storyAsset')).forEach(el => {
      const id = el.getAttribute('data-story-id');
      const home = el.object3D.position.clone();
      const kind = el.classList.contains('shadowActor') ? 'actor' : 'scenery';
      const side = el.getAttribute('data-entry') || (home.x < 0 ? 'left' : 'right');
      this.assets[id] = {
        el,
        id,
        kind,
        side,
        home,
        target: home.clone(),
        opacity: 0,
        targetOpacity: 0,
        rotation: el.object3D.rotation.z,
        targetRotation: el.object3D.rotation.z,
        baseScale: el.object3D.scale.clone(),
        materials: [],
        lastAppliedOpacity: -1,
        pulse: 0
      };
    });
    this.onHit = this.onHit.bind(this);
    this.onStart = this.onStart.bind(this);
    this.onComplete = this.onComplete.bind(this);
    this.onReplay = this.onReplay.bind(this);
    this.onReviewEnded = this.onReviewEnded.bind(this);
    this.el.sceneEl.addEventListener('beathit', this.onHit);
    this.el.sceneEl.addEventListener('startgame', this.onStart);
    this.el.sceneEl.addEventListener('songcomplete', this.onComplete);
    this.el.sceneEl.addEventListener('performancereplay', this.onReplay);
    this.reviewAudio.addEventListener('ended', this.onReviewEnded);
    const replayButton = this.el.querySelector('#shadowReplayButton');
    if (replayButton) {
      replayButton.addEventListener('click', () => {
        this.el.sceneEl.emit('performancereplay', null, false);
      });
    }
    this.reset();
  },

  onStart: function () {
    this.performance = [];
    this.setCleanReview(false);
    this.showEndCard(false);
    this.reset();
    this.prepareOpeningStage();
  },

  reset: function () {
    this.step = 0;
    Object.values(this.assets).forEach(asset => {
      const off = OFFSTAGE[asset.side] || OFFSTAGE.down;
      asset.target.copy(off);
      asset.el.object3D.position.copy(off);
      asset.opacity = 0;
      asset.targetOpacity = 0;
      asset.el.object3D.visible = false;
      this.setOpacity(asset, 0);
    });
  },

  prepareOpeningStage: function () {
    const backdrop = this.assets.act1bg;
    if (!backdrop) { return; }
    backdrop.el.object3D.visible = true;
    backdrop.el.object3D.position.copy(backdrop.home);
    backdrop.target.copy(backdrop.home);
    backdrop.opacity = 1;
    backdrop.targetOpacity = 1;
    this.setOpacity(backdrop, 1);
  },

  onHit: function () {
    // 故事结束后保持舞台终态，避免多余击打把所有资产重置成黑屏。
    if (this.step >= STORY.length) {
      return;
    }
    const [id, intent] = STORY[this.step++];
    const asset = this.assets[id];
    if (!asset) { return; }
    const song = this.el.sceneEl.components.song;
    const at = song && song.isAudioPlaying ? Math.max(0, song.getCurrentTime()) : performance.now() / 1000;
    this.performance.push({at, id, intent});
    this.applyIntent(asset, intent);

    const flash = this.el.querySelector('#shadowHitFlash');
    if (flash) {
      flash.setAttribute('animation__hit', {
        property: 'material.opacity', from: 0.2, to: 0, dur: 240,
        easing: 'easeOutQuad'
      });
    }
  },

  onComplete: function () {
    this.forceExit();
    window.setTimeout(() => this.showEndCard(true), 700);
  },

  onReplay: function () {
    this.showEndCard(false);
    this.setCleanReview(true);
    this.reset();
    this.prepareOpeningStage();
    this.reviewIndex = 0;
    const firstAt = this.performance.length ? this.performance[0].at : 0;
    this.reviewSequence = (this.performance.length ? this.performance : STORY.map((item, index) => ({
      at: index * 0.42,
      id: item[0],
      intent: item[1]
    }))).map(item => ({
      at: Math.max(0, item.at - firstAt),
      id: item.id,
      intent: item.intent
    }));
    this.reviewAudio.currentTime = 0;
    this.reviewAudio.volume = 0.58;
    const playPromise = this.reviewAudio.play();
    if (playPromise) {
      playPromise.catch(err => {
        console.error('[shadow-story] Replay audio could not start.', err);
        this.onReviewEnded();
      });
    }
  },

  onReviewEnded: function () {
    this.forceExit();
    this.setCleanReview(false);
    this.showEndCard(true);
    this.el.sceneEl.emit('performancereviewend', null, false);
  },

  forceExit: function () {
    Object.values(this.assets).forEach(asset => {
      const off = OFFSTAGE[asset.side] || OFFSTAGE.down;
      asset.target.copy(off);
      asset.targetOpacity = 0;
      if (asset.kind === 'actor') {
        asset.el.emit('puppet-action', {action: 'walk'}, false);
      }
    });
  },

  showEndCard: function (visible) {
    const card = this.el.querySelector('#shadowEndCard');
    if (card) { card.setAttribute('visible', visible); }
    const button = this.el.querySelector('#shadowReplayButton');
    if (button) {
      if (visible) {
        button.setAttribute('raycastable', '');
      } else {
        button.removeAttribute('raycastable');
      }
    }
  },

  setCleanReview: function (enabled) {
    ['#beatContainer', '#wallContainer', '#controllerRig', '#curve'].forEach(selector => {
      const el = this.el.sceneEl.querySelector(selector);
      if (el) { el.object3D.visible = !enabled; }
    });
    const debris = this.el.sceneEl.querySelector('#rigContainer');
    if (debris) { debris.object3D.visible = false; }
  },

  applyIntent: function (asset, intent) {
    if (intent === 'enter') {
      asset.el.object3D.visible = true;
      asset.target.copy(asset.home);
      asset.targetOpacity = 1;
      asset.pulse = 0.35;
      if (asset.kind === 'actor') {
        asset.el.emit('puppet-action', {action: 'walk'}, false);
      }
      return;
    }

    if (intent === 'exit') {
      const off = OFFSTAGE[asset.side] || OFFSTAGE.down;
      asset.target.copy(off);
      asset.targetOpacity = 0;
      if (asset.kind === 'actor') {
        asset.el.emit('puppet-action', {action: 'walk'}, false);
      }
      return;
    }

    // 表演：人物播放 GLB 动作；布景只做一次有意图的景深/呼吸移动。
    asset.pulse = 1;
    asset.targetRotation += asset.home.x < 0 ? 0.045 : -0.045;
    if (asset.kind === 'actor') {
      asset.el.emit('puppet-action', {action: intent}, false);
    } else {
      asset.target.z = asset.home.z + 0.12;
      asset.target.x = asset.home.x + (asset.home.x < 0 ? -0.18 : 0.18);
    }
  },

  setOpacity: function (asset, opacity) {
    if (!asset.materials.length) {
      const unique = new Set();
      asset.el.object3D.traverse(node => {
        if (!node.isMesh || !node.material) { return; }
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(material => unique.add(material));
      });
      asset.materials = Array.from(unique);
    }
    if (Math.abs(asset.lastAppliedOpacity - opacity) < 0.008) { return; }
    asset.materials.forEach(material => {
      material.transparent = true;
      material.opacity = opacity;
    });
    asset.lastAppliedOpacity = opacity;
  },

  tick: function (time, delta) {
    if (this.reviewAudio && !this.reviewAudio.paused && this.reviewSequence) {
      while (
        this.reviewIndex < this.reviewSequence.length &&
        this.reviewSequence[this.reviewIndex].at <= this.reviewAudio.currentTime
      ) {
        const event = this.reviewSequence[this.reviewIndex++];
        const asset = this.assets[event.id];
        if (asset) { this.applyIntent(asset, event.intent); }
      }
    }
    const amount = Math.min(1, delta / 180);
    Object.values(this.assets).forEach(asset => {
      const object = asset.el.object3D;
      object.position.lerp(asset.target, amount);
      asset.opacity = THREE.MathUtils.lerp(asset.opacity, asset.targetOpacity, amount);
      this.setOpacity(asset, asset.opacity);
      if (asset.opacity < 0.015 && asset.targetOpacity === 0) {
        object.visible = false;
      }
      object.rotation.z = THREE.MathUtils.lerp(object.rotation.z, asset.targetRotation, amount);
      asset.targetRotation = THREE.MathUtils.lerp(asset.targetRotation, asset.rotation, 0.035);
      asset.pulse *= 0.9;
      const breath = asset.kind === 'scenery' && asset.targetOpacity > 0
        ? Math.sin(time * 0.0007 + asset.home.z * 9) * 0.006 : 0;
      const scale = 1 + asset.pulse * 0.08 + breath;
      object.scale.set(
        asset.baseScale.x * scale,
        asset.baseScale.y * scale,
        asset.baseScale.z
      );
      if (asset.kind === 'scenery' && asset.pulse < 0.02) {
        asset.target.z = THREE.MathUtils.lerp(asset.target.z, asset.home.z, 0.04);
        asset.target.x = THREE.MathUtils.lerp(asset.target.x, asset.home.x, 0.04);
      }
    });
  },

  remove: function () {
    this.el.sceneEl.removeEventListener('beathit', this.onHit);
    this.el.sceneEl.removeEventListener('startgame', this.onStart);
    this.el.sceneEl.removeEventListener('songcomplete', this.onComplete);
    this.el.sceneEl.removeEventListener('performancereplay', this.onReplay);
    this.reviewAudio.removeEventListener('ended', this.onReviewEnded);
    this.reviewAudio.pause();
  }
});
