import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const CAMERA_POSITIONS = [
  { x: 0, y: 30, z: 250, lookY: 0 },   // Phase 0: HORIZON
  { x: 0, y: 40, z: 80, lookY: 10 },    // Phase 1: COSMOS
  { x: 0, y: 55, z: -200, lookY: 20 },  // Phase 2: DEEP
  { x: 0, y: 35, z: -450, lookY: 5 },   // Phase 3: ABOUT
];

/* Spring damper smoothing factor – lower = heavier cinematic lag */
const SMOOTHING_FACTOR = 0.04;

function Background({ activeSection = 0, theme = "dark" }) {
  const canvasRef = useRef(null);
  const smoothCamera = useRef({ x: 0, y: 30, z: 250, lookY: 0 });
  const targetCamera = useRef({ x: 0, y: 30, z: 250, lookY: 0 });
  const mountRef = useRef({ mountains: [], starField: null });
  const activeSectionRef = useRef(activeSection);
  const themeRef = useRef(theme);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId;

    /* ── Scene Setup ── */
    const isDark = themeRef.current === "dark";
    const bgColor = isDark ? 0x030509 : 0xdce6f0;
    const fogColor = isDark ? 0x030509 : 0xdce6f0;
    const fogDensity = isDark ? 0.0012 : 0.0015;
    const mountainColors = isDark
      ? [0x0a0e1a, 0x070b15, 0x050912, 0x030710]
      : [0xc8d4e6, 0xb8c8dd, 0xa8bcd4, 0x98b0cb];

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(
      CAMERA_POSITIONS[0].x,
      CAMERA_POSITIONS[0].y,
      CAMERA_POSITIONS[0].z
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgColor, 0);

    /* ── Starfield (deep layer – slowest parallax) ── */
    const isLightMode = !isDark;
    const starCount = isLightMode ? 800 : 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 1600;
      starPos[i + 1] = (Math.random() - 0.5) * 800;
      starPos[i + 2] = (Math.random() - 0.5) * 2000 - 400;

      const brightness = isLightMode ? 0.15 + Math.random() * 0.1 : 0.6 + Math.random() * 0.4;
      starCol[i] = brightness * 0.9;
      starCol[i + 1] = brightness * 0.95;
      starCol[i + 2] = brightness;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));

    const starMat = new THREE.PointsMaterial({
      size: isLightMode ? 1.0 : 1.8,
      vertexColors: true,
      transparent: true,
      opacity: isLightMode ? 0.25 : 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    mountRef.current.starField = starField;

    /* ── Nebula Glow Particles (mid layer) ── */
    const nebulaCount = isLightMode ? 200 : 400;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount * 3; i += 3) {
      nebulaPos[i] = (Math.random() - 0.5) * 800;
      nebulaPos[i + 1] = (Math.random() - 0.5) * 300 + 40;
      nebulaPos[i + 2] = (Math.random() - 0.5) * 1200 - 200;

      if (isLightMode) {
        nebulaCol[i] = 0.6 + Math.random() * 0.2;
        nebulaCol[i + 1] = 0.7 + Math.random() * 0.2;
        nebulaCol[i + 2] = 1.0 + Math.random() * 0.0;
      } else {
        nebulaCol[i] = 0.15 + Math.random() * 0.1;
        nebulaCol[i + 1] = 0.2 + Math.random() * 0.15;
        nebulaCol[i + 2] = 0.8 + Math.random() * 0.2;
      }
    }

    nebulaGeo.setAttribute("position", new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute("color", new THREE.BufferAttribute(nebulaCol, 3));

    const nebulaMat = new THREE.PointsMaterial({
      size: isLightMode ? 4 : 8,
      vertexColors: true,
      transparent: true,
      opacity: isLightMode ? 0.08 : 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebula);

    /* ── Mountain / Terrain Layers (foreground parallax) ──
       Each layer has a different Z-depth and speed multiplier.
       Foreground layers move faster → creates depth illusion. */
    const mountainLayers = [];
    const layerConfigs = isDark
      ? [
          { z: -100, y: -40, color: 0x0a0e1a, opacity: 0.6, speed: 1.0 },
          { z: -250, y: -55, color: 0x070b15, opacity: 0.5, speed: 1.5 },
          { z: -500, y: -70, color: 0x050912, opacity: 0.4, speed: 2.2 },
          { z: -800, y: -85, color: 0x030710, opacity: 0.3, speed: 3.0 },
        ]
      : [
          { z: -100, y: -40, color: 0xd0dce8, opacity: 0.5, speed: 1.0 },
          { z: -250, y: -55, color: 0xc0ccdc, opacity: 0.4, speed: 1.5 },
          { z: -500, y: -70, color: 0xb0bcd0, opacity: 0.3, speed: 2.2 },
          { z: -800, y: -85, color: 0xa0acc4, opacity: 0.2, speed: 3.0 },
        ];

    layerConfigs.forEach((config) => {
      const width = 1200;
      const segments = 80;
      const geo = new THREE.PlaneGeometry(width, 200, segments, 10);

      /* Procedural mountain heightmap */
      const posAttr = geo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const height =
          Math.sin(x * 0.008 + config.z * 0.01) * 35 +
          Math.sin(x * 0.015 + y * 0.01) * 20 +
          Math.cos(x * 0.003) * 50 +
          Math.random() * 5;
        posAttr.setZ(i, y > 0 ? height : 0);
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        side: THREE.DoubleSide,
        fog: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI * 0.35;
      mesh.position.set(0, config.y, config.z);
      mesh.userData = { baseZ: config.z, speed: config.speed };

      scene.add(mesh);
      mountainLayers.push(mesh);
    });

    mountRef.current.mountains = mountainLayers;

    /* ── Ambient light (subtle) ── */
    const ambientLight = new THREE.AmbientLight(isDark ? 0x1a2a4a : 0x8a9ab0, isDark ? 0.3 : 0.4);
    scene.add(ambientLight);

    /* ────────────────────────────────────────────────────
       ANIMATION LOOP
       Implements 4 mathematical layers:
         1. Scroll Normalization → scrollY / maxScroll = 0..1
         2. Segmented Interpolation → camera position vectors
         3. Spring Damper → lerp with SMOOTHING_FACTOR
         4. Depth Parallax → mountain layers at different speeds
       ──────────────────────────────────────────────────── */
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const time = Date.now() * 0.0001;
      const scrollY = window.scrollY || 0;

      /* ── Camera position driven by active section ──
         Indexes into CAMERA_POSITIONS based on the current section
         (0=hero, 1=about, 2=features, 3=footer). The spring damper
         below smoothly interpolates between positions. */
      const sectionIndex = Math.min(
        activeSectionRef.current,
        CAMERA_POSITIONS.length - 1
      );
      const targetPos = CAMERA_POSITIONS[sectionIndex];

      targetCamera.current.x = targetPos.x;
      targetCamera.current.y = targetPos.y;
      targetCamera.current.z = targetPos.z;
      targetCamera.current.lookY = targetPos.lookY;

      /* ── Layer 3: Spring Damper (smooth tracking) ──
         Lower SMOOTHING_FACTOR = heavier, more cinematic lag.
         Acts as a physical spring damper on the camera. */
      const s = smoothCamera.current;
      const tgt = targetCamera.current;

      s.x += (tgt.x - s.x) * SMOOTHING_FACTOR;
      s.y += (tgt.y - s.y) * SMOOTHING_FACTOR;
      s.z += (tgt.z - s.z) * SMOOTHING_FACTOR;
      s.lookY += (tgt.lookY - s.lookY) * SMOOTHING_FACTOR;

      camera.position.x = s.x;
      camera.position.y = s.y;
      camera.position.z = s.z;
      camera.lookAt(s.x * 0.3, s.lookY, s.z - 200);

      /* ── Layer 4: Continuous Depth Parallax ──
         Mountain layers travel along Z at distinct speed multipliers.
         Foreground layers (higher index) move exponentially faster. */
      mountainLayers.forEach((mountain) => {
        const speed = mountain.userData.speed;
        const targetZ = mountain.userData.baseZ + scrollY * speed * 0.08;
        mountain.position.z += (targetZ - mountain.position.z) * 0.06;
      });

      /* ── Ambient starfield rotation ── */
      starField.rotation.y = time * 0.15;
      starField.rotation.x = time * 0.03;

      /* Nebula drift */
      nebula.rotation.y = time * 0.08;
      nebula.position.z = scrollY * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    /* ── Resize Handler ── */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      starGeo.dispose();
      starMat.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      mountainLayers.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      ambientLight.dispose?.();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default Background;
