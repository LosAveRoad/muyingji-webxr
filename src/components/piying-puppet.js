const ASSET_ROOT = 'assets/shadowplay/piying/';

function retargetClip (clip, sourceRoot, targets) {
  const sourceByUuid = {};
  sourceRoot.traverse(node => { sourceByUuid[node.uuid] = node; });
  const tracks = [];

  clip.tracks.forEach(track => {
    const separator = track.name.lastIndexOf('.');
    if (separator < 0) { return; }
    const sourceId = track.name.slice(0, separator);
    const property = track.name.slice(separator + 1);
    if (property !== 'quaternion') { return; }

    const source = sourceRoot.getObjectByName(sourceId) || sourceByUuid[sourceId];
    const target = source && targets[source.name || sourceId];
    if (!source || !target) { return; }

    const values = new Float32Array(track.values.length);
    const restInverse = source.quaternion.clone().invert();
    const sourceKey = new THREE.Quaternion();
    const delta = new THREE.Quaternion();
    const targetKey = new THREE.Quaternion();
    for (let i = 0; i < track.values.length; i += 4) {
      sourceKey.fromArray(track.values, i).normalize();
      delta.copy(restInverse).multiply(sourceKey);
      targetKey.copy(target.quaternion).multiply(delta).normalize();
      targetKey.toArray(values, i);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(
      `${target.uuid}.quaternion`,
      Array.from(track.times),
      Array.from(values),
      track.getInterpolation()
    ));
  });

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function findClip (gltf, preferred) {
  return gltf.animations.find(clip => clip.name === preferred) || gltf.animations[0];
}

AFRAME.registerComponent('piying-puppet', {
  schema: {
    height: {default: 3.4},
    facing: {default: 1},
    texture: {default: 'yaoling-puppet-atlas.png'}
  },

  init: function () {
    this.mixer = null;
    this.actions = {};
    this.current = '';
    this.onAction = evt => this.playAction(evt.detail.action);
    this.el.addEventListener('puppet-action', this.onAction);
    this.load();
  },

  load: function () {
    const loader = new THREE.GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    Promise.all([
      new Promise((resolve, reject) => loader.load(`${ASSET_ROOT}piying-man-rig-hi.glb`, resolve, null, reject)),
      new Promise((resolve, reject) => loader.load(`${ASSET_ROOT}piying-man-walk.glb`, resolve, null, reject)),
      new Promise((resolve, reject) => loader.load(`${ASSET_ROOT}piying-man-run.glb`, resolve, null, reject)),
      new Promise((resolve, reject) => loader.load(`${ASSET_ROOT}piying-man-flying.glb`, resolve, null, reject)),
      new Promise((resolve, reject) => textureLoader.load(`${ASSET_ROOT}${this.data.texture}`, resolve, null, reject))
    ]).then(([rig, walk, run, flying, texture]) => {
      texture.encoding = THREE.sRGBEncoding;
      texture.flipY = false;

      const model = rig.scene;
      const targets = {};
      model.traverse(child => {
        if (child.name === 'Plane' || child.name.indexOf('a0') === 0) {
          child.visible = false;
          return;
        }
        if (child.name && !targets[child.name]) { targets[child.name] = child; }
        if (!child.isMesh) { return; }
        child.frustumCulled = false;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          material.map = texture;
          material.transparent = true;
          material.depthWrite = true;
          material.side = THREE.DoubleSide;
          material.emissive = new THREE.Color('#6f210f');
          material.emissiveIntensity = 0.22;
          material.onBeforeCompile = shader => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              [
                '#include <map_fragment>',
                'float piyingMax = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));',
                'float piyingMin = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));',
                'float piyingLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));',
                'bool rigGreen = diffuseColor.g > 0.72 && diffuseColor.r < 0.34 && diffuseColor.b < 0.34;',
                'bool rigYellow = diffuseColor.r > 0.9 && diffuseColor.g > 0.78 && diffuseColor.b < 0.14;',
                'bool editorGrey = piyingLuma > 0.18 && piyingLuma < 0.97 && piyingMax - piyingMin < 0.15;',
                'if (rigGreen || rigYellow || editorGrey || piyingLuma > 0.965) discard;'
              ].join('\n')
            );
          };
          material.customProgramCacheKey = () => 'moonrider-piying-cutout-v1';
          material.needsUpdate = true;
        });
      });

      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = this.data.height / Math.max(size.y, 0.001);
      model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      model.scale.setScalar(scale);
      model.scale.x *= this.data.facing < 0 ? -1 : 1;

      this.mixer = new THREE.AnimationMixer(model);
      const hiClip = findClip(rig, 'piying_man_hi');
      const walkClip = findClip(walk, 'piying_man_walk');
      const runClip = findClip(run, 'run');
      const flyingClip = findClip(flying, 'flying');
      this.actions = {
        idle: this.mixer.clipAction(hiClip, model),
        hi: this.mixer.clipAction(hiClip, model),
        walk: this.mixer.clipAction(retargetClip(walkClip, walk.scene, targets), model),
        run: this.mixer.clipAction(retargetClip(runClip, run.scene, targets), model),
        flying: this.mixer.clipAction(retargetClip(flyingClip, flying.scene, targets), model)
      };
      this.el.object3D.add(model);
      this.playAction('idle');
    }).catch(err => {
      console.error('[piying-puppet] GLB load failed.', err);
    });
  },

  playAction: function (name) {
    if (!this.mixer || !this.actions[name]) { return; }
    const next = this.actions[name];
    Object.keys(this.actions).forEach(key => {
      if (this.actions[key] !== next) { this.actions[key].fadeOut(0.12); }
    });
    next.reset();
    next.enabled = true;
    next.clampWhenFinished = true;
    if (name === 'idle') {
      next.setLoop(THREE.LoopOnce, 1);
      next.timeScale = 0;
    } else if (name === 'walk' || name === 'run') {
      next.setLoop(THREE.LoopRepeat, 2);
      next.timeScale = 1;
    } else {
      next.setLoop(THREE.LoopOnce, 1);
      next.timeScale = 1;
    }
    next.fadeIn(0.12).play();
    this.current = name;
  },

  tick: function (time, delta) {
    if (this.mixer) { this.mixer.update(Math.min(delta / 1000, 0.05)); }
  },

  remove: function () {
    this.el.removeEventListener('puppet-action', this.onAction);
  }
});
