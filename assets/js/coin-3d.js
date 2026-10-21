/**
 * 3D Rotating Coin for Incubation Capsule Pod
 * Uses Three.js WebGL to render an orange tech token with milled ridges
 * and the new concentric ring logo on both sides.
 */
(function () {
  function initCoin3D() {
    const canvas = document.getElementById('coin-3d-canvas');
    if (!canvas || !window.THREE) return;
    const container = canvas.parentElement;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    function resize() {
      const w = container.clientWidth || 300;
      const h = container.clientHeight || w;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(-3.5, 4.5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffa055, 0.65);
    fillLight.position.set(3.5, -3, 3);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.2);
    backLight.position.set(3, 4, -5);
    scene.add(backLight);

    // Milled rim texture (creates realistic coin ridges on edge)
    const rimCanvas = document.createElement('canvas');
    rimCanvas.width = 1024;
    rimCanvas.height = 64;
    const rimCtx = rimCanvas.getContext('2d');
    rimCtx.fillStyle = '#808080';
    rimCtx.fillRect(0, 0, 1024, 64);
    for (let x = 0; x < 1024; x += 8) {
      rimCtx.fillStyle = '#ffffff';
      rimCtx.fillRect(x, 0, 4, 64);
      rimCtx.fillStyle = '#000000';
      rimCtx.fillRect(x + 4, 0, 4, 64);
    }
    const rimBumpTex = new THREE.CanvasTexture(rimCanvas);
    rimBumpTex.wrapS = THREE.RepeatWrapping;

    const texLoader = new THREE.TextureLoader();
    let frontTex, backTex;
    let loaded = 0;
    const onLoaded = () => {
      loaded++;
      if (loaded === 2) buildMesh();
    };

    texLoader.load('/assets/coin_face_front.png', (t) => {
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      frontTex = t;
      onLoaded();
    });

    texLoader.load('/assets/coin_face_back.png', (t) => {
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      backTex = t;
      onLoaded();
    });

    let coinGroup;
    function buildMesh() {
      coinGroup = new THREE.Group();
      scene.add(coinGroup);

      const radius = 2.45;
      const thickness = 0.32;

      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xf55200,
        metalness: 0.45,
        roughness: 0.28,
        bumpMap: rimBumpTex,
        bumpScale: 0.05
      });

      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        metalness: 0.15,
        roughness: 0.22
      });

      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        metalness: 0.15,
        roughness: 0.22
      });

      const cylinderGeo = new THREE.CylinderGeometry(radius, radius, thickness, 128, 1, false);
      const coinMesh = new THREE.Mesh(cylinderGeo, [rimMat, frontMat, backMat]);
      coinMesh.rotation.x = Math.PI / 2;
      coinGroup.add(coinMesh);

      // Raised outer bevel rings
      const bevelMat = new THREE.MeshStandardMaterial({
        color: 0xf55200,
        metalness: 0.4,
        roughness: 0.25
      });
      const torusGeo = new THREE.TorusGeometry(radius - 0.03, 0.055, 16, 120);

      const frontRing = new THREE.Mesh(torusGeo, bevelMat);
      frontRing.position.z = thickness / 2 + 0.008;
      coinGroup.add(frontRing);

      const backRing = new THREE.Mesh(torusGeo, bevelMat);
      backRing.position.z = -thickness / 2 - 0.008;
      coinGroup.add(backRing);

      // Angle matches the reference capsule pod inclination
      coinGroup.rotation.x = 0.22;
      coinGroup.rotation.z = -0.15;
    }

    let isVisible = true;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0.05 });
      io.observe(container);
    }

    let clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible || !coinGroup) return;
      const elapsedTime = clock.getElapsedTime();
      coinGroup.rotation.y = elapsedTime * 1.1;
      coinGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.07;
      renderer.render(scene, camera);
    }
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoin3D);
  } else {
    initCoin3D();
  }
})();
