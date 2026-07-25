const STORY = [
  // 序：月下开卷。每一项严格对应一次击打、一个资产、一个动作意图。
  ['backdrop', 'enter'], ['moon', 'enter'], ['garden', 'enter'],
  ['garden', 'perform'],

  // 第一幕：侠客入园，发现密函。
  ['hero', 'enter'], ['desk', 'enter'], ['hero', 'walk'],
  ['desk', 'perform'], ['hero', 'hi'], ['desk', 'exit'], ['garden', 'exit'],

  // 第二幕：强敌现身，追逐交锋。
  ['rock', 'enter'], ['villain', 'enter'], ['villain', 'hi'],
  ['hero', 'run'], ['villain', 'run'], ['hero', 'exit'],

  // 第三幕：女将从月下赶来，三人决战。
  ['general', 'enter'], ['general', 'flying'], ['hero', 'hi'],
  ['villain', 'hi'], ['general', 'run'], ['villain', 'exit'], ['rock', 'exit'],

  // 尾声：老者揭示密函，众人离场，舞台收卷。
  ['elder', 'enter'], ['hero', 'enter'], ['elder', 'hi'], ['hero', 'hi'],
  ['general', 'hi'], ['elder', 'exit'], ['general', 'exit'],
  ['hero', 'exit'], ['moon', 'exit'], ['backdrop', 'exit']
];

const OFFSTAGE = {
  left: new THREE.Vector3(-7.4, -0.7, 0),
  right: new THREE.Vector3(7.4, -0.7, 0),
  down: new THREE.Vector3(0, -5.4, 0)
};

AFRAME.registerComponent('shadow-story', {
  init: function () {
    this.step = 0;
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
        pulse: 0
      };
    });
    this.onHit = this.onHit.bind(this);
    this.onStart = this.reset.bind(this);
    this.el.sceneEl.addEventListener('beathit', this.onHit);
    this.el.sceneEl.addEventListener('startgame', this.onStart);
    this.reset();
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

  onHit: function () {
    // 故事结束后从第一幕重新开卷；一个击打永远只执行这一项。
    if (this.step >= STORY.length) {
      this.reset();
    }
    const [id, intent] = STORY[this.step++];
    const asset = this.assets[id];
    if (!asset) { return; }
    this.applyIntent(asset, intent);

    const flash = this.el.querySelector('#shadowHitFlash');
    if (flash) {
      flash.setAttribute('animation__hit', {
        property: 'material.opacity', from: 0.2, to: 0, dur: 240,
        easing: 'easeOutQuad'
      });
    }
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
    asset.el.object3D.traverse(node => {
      if (!node.isMesh || !node.material) { return; }
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => {
        material.transparent = true;
        material.opacity = opacity;
      });
    });
  },

  tick: function (time, delta) {
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
  }
});
