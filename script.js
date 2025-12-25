let scene, camera, renderer;
let treeGroup;
let lights = [];
let snowflakes = [];
let phase = 0;

// Dirección global de la nieve (↙)
const SNOW_DIR = new THREE.Vector2(-0.03, -0.045);

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  treeGroup = new THREE.Group();
  scene.add(treeGroup);

  crearConoDifuminado();
  crearLuces();
  crearEstrella();
  crearNieve();

  window.addEventListener("resize", onResize);
}

//
// 🌲 CONO DIFUMINADO
//
function crearConoDifuminado() {
  const geometry = new THREE.ConeGeometry(4, 8, 64, 20, true);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    vertexShader: `
      varying float vY;
      void main() {
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vY;
      void main() {
        float alpha = smoothstep(-4.0, 3.5, vY);
        gl_FragColor = vec4(0.04, 0.45, 0.25, alpha * 0.4);
      }
    `
  });

  treeGroup.add(new THREE.Mesh(geometry, material));
}

//
// 💡 LUCES
//
function crearLuces() {
  const total = 260;
  const altura = 8;
  const vueltas = 16;
  const colores = [0xff3333, 0x3399ff, 0xffcc33];

  for (let i = 0; i < total; i++) {
    if (i % 5 >= 3) continue;

    const t = i / total;
    const angle = t * Math.PI * vueltas;
    const radius = (1 - t) * 4;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshBasicMaterial({ color: colores[i % colores.length] })
    );

    mesh.position.set(
      Math.cos(angle) * radius,
      t * altura - altura / 2,
      Math.sin(angle) * radius
    );

    lights.push({ mesh, t });
    treeGroup.add(mesh);
  }
}

//
// ⭐ ESTRELLA
//
function crearEstrella() {
  const shape = new THREE.Shape();
  const spikes = 5, outer = 0.7, inner = 0.3;
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;

  shape.moveTo(0, -outer);
  for (let i = 0; i < spikes; i++) {
    shape.lineTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
    rot += step;
    shape.lineTo(Math.cos(rot) * inner, Math.sin(rot) * inner);
    rot += step;
  }
  shape.closePath();

  const star = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: 0xffee66, depthWrite: false })
  );
  star.position.y = 4.6;
  scene.add(star);
}

//
// ❄️ NIEVE COHERENTE
//
function crearNieve() {
  const total = 400;

  for (let i = 0; i < total; i++) {
    const flake = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
      })
    );

    resetSnowflake(flake, true);
    snowflakes.push(flake);
    scene.add(flake);
  }
}

// Posiciona el copo SIEMPRE en la franja superior o derecha
function resetSnowflake(flake, randomY = false) {
  const spawnFromTop = Math.random() > 0.5;

  if (spawnFromTop) {
    flake.position.x = Math.random() * 30 - 10;
    flake.position.y = 10 + Math.random() * 5;
  } else {
    flake.position.x = 15 + Math.random() * 5;
    flake.position.y = Math.random() * 20 - 10;
  }

  flake.position.z = Math.random() * 20 - 10;
}

//
// 🔄 ANIMACIÓN
//
function animate() {
  requestAnimationFrame(animate);

  phase += 0.02;

  lights.forEach(obj => {
    const angle = obj.t * Math.PI * 16 + phase;
    const radius = (1 - obj.t) * 4;
    obj.mesh.position.x = Math.cos(angle) * radius;
    obj.mesh.position.z = Math.sin(angle) * radius;
  });

  treeGroup.rotation.y += 0.002;

  snowflakes.forEach(flake => {
    flake.position.x += SNOW_DIR.x;
    flake.position.y += SNOW_DIR.y;

    if (flake.position.y < -12 || flake.position.x < -18) {
      resetSnowflake(flake);
    }
  });

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
