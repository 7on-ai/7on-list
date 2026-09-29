/* ARC in 3D: the model from design/arc, its screen drawn live on the glass,
   buttons that press in, and a gentle drag to turn it. Loaded only when the
   demo comes near the viewport. */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { deviceFill } from "./layout";

export type ArcButton = "pwr" | "boot";

export type Anchor = { x: number; y: number; facing: number };
export type AnchorId = ArcButton | "dot";

export type SceneEvents = {
  onButton(button: ArcButton): void;
  /* Touch on the glass, in millimetres from the centre (x right, y up) */
  onScreen(x: number, y: number): void;
  onDrag(): void;
};

export type ArcSceneHandle = {
  render(dt: number, screenChanged: boolean): void;
  press(button: ArcButton): void;
  /* Where each button and the red dot are on the page, for their labels;
     facing < 0 when turned away */
  anchors(): Record<AnchorId, Anchor>;
  dispose(): void;
};

const MODEL_URL = "/models/arc.glb";
const GLASS_MM = 48.96;
const NODE = { pwr: "PWR button", boot: "BOOT button" } as const;

/* Resting pose: screen turned a little to the right, as ARC faces on the page */
const BASE_YAW = 0.5;
const BASE_PITCH = -0.1;

export async function createArcScene(
  container: HTMLElement,
  screen: HTMLCanvasElement,
  events: SceneEvents,
  { reducedMotion = false } = {}
): Promise<ArcSceneHandle> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;outline:none";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 2);

  // Hierarchy: float (bob) → turn (drag, pose) → orient (screen faces +Z) → model
  const float = new THREE.Group();
  const turn = new THREE.Group();
  const orient = new THREE.Group();
  orient.rotation.x = Math.PI / 2; // glTF is Y-up with the screen facing +Y
  float.add(turn);
  turn.add(orient);
  scene.add(float);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(MODEL_URL);
  const model = gltf.scene;
  model.position.y = -0.0075; // turn around the middle of its 15 mm thickness
  orient.add(model);

  // The loader turns spaces in names into underscores
  const find = (name: string) => model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)) as THREE.Mesh;
  const root = find("7on ARC");

  // ── Screen: the live canvas, under glossy glass ────────────────
  const screenTexture = new THREE.CanvasTexture(screen);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.flipY = false; // glTF UVs
  screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const glass = find("Glass");
  glass.material = new THREE.MeshPhysicalMaterial({
    color: 0x000000,
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    emissive: 0xffffff,
    emissiveMap: screenTexture,
    emissiveIntensity: 1,
  });

  // ── Metal: brushed around the rim ─────────────────────────────
  const brushed = brushedMaps(renderer);
  // The rim only: on the flat back the fine rings alias into ripples at
  // screen resolution, so the back keeps a plain satin finish
  for (const name of ["Body"]) {
    const mesh = find(name);
    if (!mesh) continue;
    cylinderUVs(mesh.geometry);
    const m = mesh.material as THREE.MeshStandardMaterial;
    mesh.material = new THREE.MeshStandardMaterial({
      color: m.color,
      metalness: 1,
      roughness: 1, // the map holds the roughness
      roughnessMap: brushed.roughness,
      normalMap: brushed.normal,
      normalScale: new THREE.Vector2(0.22, 0.22),
    });
  }
  const back = find("Back cover");
  if (back) {
    const m = back.material as THREE.MeshStandardMaterial;
    m.roughness = 0.42;
    m.color.setScalar(0.66);
  }
  // The laser-engraved mark: matte, where the anodising was burnt off.
  // A shade darker than it would read in a photo, so it shows on screen.
  const logo = find("Engraved logo");
  if (logo) {
    const m = logo.material as THREE.MeshStandardMaterial;
    m.color.setScalar(0.5);
    m.metalness = 0;
    m.roughness = 0.9;
  }
  for (const name of Object.values(NODE)) {
    const mesh = find(name);
    (mesh.material as THREE.MeshStandardMaterial).roughness = 0.16;
  }

  // ── Buttons: where they are, which way they face, big touch areas ──
  const buttons = (Object.keys(NODE) as ArcButton[]).map((id) => {
    const mesh = find(NODE[id]);
    const rest = mesh.position.clone();
    const out = new THREE.Vector3(rest.x, 0, rest.z).normalize(); // model space, mm
    const hit = new THREE.Mesh(new THREE.SphereGeometry(id === "pwr" ? 4.5 : 4, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(rest).addScaledVector(out, 1);
    hit.userData.button = id;
    root.add(hit);
    return { id, mesh, rest, out, hit, pressedAt: -10 };
  });

  // ── Size and camera ────────────────────────────────────────────
  let width = 1;
  let height = 1;
  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // The device fills most of the short side; less on phones, leaving room for the labels
    const fit = 0.062 / deviceFill(width);
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, fit / (2 * halfTan * Math.min(1, camera.aspect)));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  container.appendChild(canvas);

  // ── Pointer: tap buttons or the screen, drag to turn ───────────
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const targets = [glass, ...buttons.map((b) => b.hit)];
  let down: { x: number; y: number; yaw: number; pitch: number; id: number; touch: boolean } | null = null;
  let dragging = false;
  let dragYaw = 0; // unbounded: it turns all the way round
  let dragPitch = 0;
  let spin = 0; // rad/s, carried on after a flick
  let prev = { x: 0, t: 0 };
  let lastTouch = -10;
  let clock = 0;
  let kick = 0; // a small recoil when a button is pressed

  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(targets, false)[0];
  };

  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, yaw: dragYaw, pitch: dragPitch, id: e.pointerId, touch: e.pointerType === "touch" };
    dragging = false;
    spin = 0;
    prev = { x: e.clientX, t: performance.now() };
  };
  const onMove = (e: PointerEvent) => {
    if (down && e.pointerId === down.id) {
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
        events.onDrag();
      }
      if (dragging) {
        dragYaw = down.yaw + dx * 0.009;
        const now = performance.now();
        if (now > prev.t) spin = THREE.MathUtils.lerp(spin, ((e.clientX - prev.x) * 0.009 * 1000) / (now - prev.t), 0.5);
        prev = { x: e.clientX, t: now };
        if (!down.touch) dragPitch = THREE.MathUtils.clamp(down.pitch + dy * 0.006, -0.5, 0.5);
        lastTouch = clock;
      }
      return;
    }
    if (e.pointerType === "mouse") canvas.style.cursor = pick(e) ? "pointer" : "grab";
  };
  const onUp = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const wasDrag = dragging;
    down = null;
    dragging = false;
    lastTouch = clock;
    if (wasDrag) {
      if (performance.now() - prev.t > 80) spin = 0; // held still before letting go
      spin = THREE.MathUtils.clamp(spin, -14, 14);
      return;
    }
    const hit = pick(e);
    if (!hit) return;
    if (hit.object === glass && hit.uv) {
      events.onScreen((hit.uv.x - 0.5) * GLASS_MM, (0.5 - hit.uv.y) * GLASS_MM);
    } else if (hit.object.userData.button) {
      events.onButton(hit.object.userData.button as ArcButton);
    }
  };
  const onCancel = () => {
    down = null;
    dragging = false;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);

  // ── Frame ─────────────────────────────────────────────────────
  let yaw = BASE_YAW; // starts exactly where the still left off
  let pitch = BASE_PITCH;
  const tmp = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const hidden = { x: 0, y: 0, facing: -1 };
  const anchors: Record<AnchorId, Anchor> = { pwr: hidden, boot: hidden, dot: hidden };
  const up = new THREE.Vector3(0, 1, 0); // the screen's facing, in model space

  const press = (id: ArcButton) => {
    const b = buttons.find((x) => x.id === id)!;
    b.pressedAt = clock;
    kick = id === "pwr" ? 1 : 0.7;
  };

  const render = (dt: number, screenChanged: boolean) => {
    dt = Math.min(dt, 1 / 20);
    clock += dt;

    // A flick keeps it turning, slowing down; left alone, it comes back
    // to its pose the short way round
    if (!down) {
      dragYaw += spin * dt;
      spin *= Math.exp(-2.4 * dt);
      if (Math.abs(spin) > 0.3) lastTouch = clock;
      else if (clock - lastTouch > 3) {
        const home = Math.round(dragYaw / (Math.PI * 2)) * Math.PI * 2;
        dragYaw += (home - dragYaw) * (1 - Math.exp(-2 * dt));
        dragPitch *= Math.exp(-2 * dt);
      }
    }
    const ease = 1 - Math.exp(-(reducedMotion ? 30 : 5) * dt);
    yaw += (BASE_YAW + dragYaw - yaw) * ease;
    pitch += (BASE_PITCH + dragPitch - pitch) * ease;
    kick *= Math.exp(-9 * dt);
    turn.rotation.set(pitch, yaw - kick * 0.035, 0);
    if (!reducedMotion) {
      float.position.y = Math.sin(clock * 1.2) * 0.0012;
      float.rotation.z = Math.sin(clock * 0.8) * 0.012;
    }

    // Buttons: in quickly, out with a little spring
    for (const b of buttons) {
      const s = clock - b.pressedAt;
      const depth = s < 0.07 ? s / 0.07 : Math.max(0, Math.exp(-(s - 0.07) * 14) * Math.cos((s - 0.07) * 18));
      b.mesh.position.copy(b.rest).addScaledVector(b.out, -0.55 * depth);
    }

    if (screenChanged) screenTexture.needsUpdate = true;
    renderer.render(scene, camera);

    // Label positions, and whether each button faces the camera
    for (const b of buttons) {
      b.mesh.getWorldPosition(tmp);
      nrm.copy(b.out).transformDirection(root.matrixWorld);
      toCam.copy(camera.position).sub(tmp).normalize();
      const facing = nrm.dot(toCam);
      tmp.project(camera);
      anchors[b.id] = { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height, facing };
    }
    glass.getWorldPosition(tmp);
    nrm.copy(up).transformDirection(root.matrixWorld);
    tmp.addScaledVector(nrm, 0.00045); // the glass's top face
    toCam.copy(camera.position).sub(tmp).normalize();
    const dotFacing = nrm.dot(toCam);
    tmp.project(camera);
    anchors.dot = { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height, facing: dotFacing };
  };

  return {
    render,
    press,
    anchors: () => anchors,
    dispose() {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        mats.forEach((m) => m.dispose());
      });
      screenTexture.dispose();
      brushed.normal.dispose();
      brushed.roughness.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

/* UVs for brushing: u runs around the rim (mirrored at the seam, so it
   never jumps), v across the lines, by height. Model units are millimetres. */
function cylinderUVs(geometry: THREE.BufferGeometry) {
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    uv[i * 2] = Math.abs(Math.atan2(z, x)) / Math.PI;
    uv[i * 2 + 1] = y / 15;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/* Brushed-metal detail, generated: fine lines each with its own depth, the
   odd deeper mark, streaks that fade along their length, and the sheen
   varying with them. Lines vary along v; u is the brushing direction. */
function brushedMaps(renderer: THREE.WebGLRenderer) {
  const W = 256;
  const H = 1024;
  const LINES = 150; // across the texture, ~10 per mm on the rim
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const groove = (freq: number, weight: number, rare = 0) => {
    const depths = Array.from({ length: freq + 1 }, () => {
      const d = rand();
      return rare ? (d > rare ? 1 : 0) : d;
    });
    return (v: number) => {
      const u = v * freq;
      const f = u - Math.floor(u);
      return depths[Math.floor(u)] * (1 - (2 * f - 1) ** 2) * weight;
    };
  };
  const main = groove(LINES, 1);
  const fine = groove(LINES * 2, 0.45);
  const marks = groove(Math.round(LINES * 0.3), 1.2, 0.9);
  const height = new Float32Array(H);
  for (let y = 0; y < H; y++) height[y] = main(y / H) + fine(y / H);
  const markH = new Float32Array(H);
  for (let y = 0; y < H; y++) markH[y] = marks(y / H);

  // Slow streaks along the brushing: smooth 1D noise per band of lines
  const bands = 64;
  const phase = Array.from({ length: bands }, () => rand() * 10);
  const streak = (x: number, y: number) => {
    const p = phase[Math.floor((y / H) * bands) % bands];
    return 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((x / W) * Math.PI * 2 * 2 + p) * Math.sin((x / W) * Math.PI * 2 * 3 + p * 1.7));
  };

  const normal = document.createElement("canvas");
  const rough = document.createElement("canvas");
  normal.width = rough.width = W;
  normal.height = rough.height = H;
  const nImg = normal.getContext("2d")!.createImageData(W, H);
  const rImg = rough.getContext("2d")!.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const up = (y + 1) % H;
    const dn = (y - 1 + H) % H;
    for (let x = 0; x < W; x++) {
      const s = streak(x, y);
      const slope = (height[up] - height[dn]) * s + (markH[up] - markH[dn]);
      const ny = THREE.MathUtils.clamp(-slope * 0.9, -1, 1);
      const nz = Math.sqrt(1 - ny * ny);
      const i = (y * W + x) * 4;
      nImg.data[i] = 128;
      nImg.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[i + 3] = 255;
      const r = 0.3 + (height[y] * s - 0.5) * 0.14 + (s - 0.7) * 0.08;
      const g = Math.round(THREE.MathUtils.clamp(r, 0.12, 0.6) * 255);
      rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = g;
      rImg.data[i + 3] = 255;
    }
  }
  normal.getContext("2d")!.putImageData(nImg, 0, 0);
  rough.getContext("2d")!.putImageData(rImg, 0, 0);

  const make = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 1);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.colorSpace = THREE.NoColorSpace;
    return t;
  };
  return { normal: make(normal), roughness: make(rough) };
}
