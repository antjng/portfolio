import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';


function initCube() {
  const canvas = document.getElementById("canvas3d");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const directional = new THREE.DirectionalLight(0xffffff, 1.25);
  directional.position.set(2, 3, 4);
  scene.add(ambient, directional);

  // cube
  const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const textureLoader = new THREE.TextureLoader();
  // pic
  const texture = textureLoader.load("public/img/cube.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  const materials = Array.from({ length: 6 }, () => {
    // glow with the photo's own colours (a flat white emissive washes it out)
    return new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: texture,
      emissiveIntensity: 0.4,
    });
  });

  const cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);

  function resizeRenderer() {
    const parent = canvas.parentElement || canvas;
    const width = parent.clientWidth || 200;
    const height = parent.clientHeight || 200;

    if (width === 0 || height === 0) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resizeRenderer();
  window.addEventListener("resize", resizeRenderer);

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;

  function onPointerDown(e) {
    isDragging = true;
    canvas.classList.add("dragging");
    canvas.setPointerCapture?.(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
    velX = 0;
    velY = 0;
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    const rotSpeed = 0.01;
    cube.rotation.y += dx * rotSpeed;
    cube.rotation.x += dy * rotSpeed;

    lastX = e.clientX;
    lastY = e.clientY;

    velX = dx;
    velY = dy;
  }

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    canvas.classList.remove("dragging");
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch (_) {
      // ignore
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  function animate() {
    cube.rotation.x += 0.008;
    cube.rotation.y += 0.008;
    cube.rotation.z += 0.008;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initCube();
  initProjects();
  initBlog();
  initMusic();
  updateWebringLogo();
});

function initBlog() {
  const links = document.querySelectorAll('.blog-post-link');
  const content = document.getElementById('blog-content');
  if (!links.length || !content) return;

  let loadToken = 0;

  const swapContent = async (html) => {
    // fade old out
    content.classList.add('is-swapping');
    await new Promise((r) => setTimeout(r, 160));

    content.innerHTML = html;

    // fade new in
    requestAnimationFrame(() => {
      content.classList.remove('is-swapping');
    });
  };

  links.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const slug = link.dataset.post;
      if (!slug) return;

      const token = ++loadToken;

      try {
        const res = await fetch(`public/posts/${slug}.md`);
        if (!res.ok) throw new Error('not found');
        const text = await res.text();

        if (token !== loadToken) return; // user clicked something else

        if (window.marked) {
          await swapContent(window.marked.parse(text));
        } else {
          await swapContent(`<pre>${escapeHtml(text)}</pre>`);
        }
      } catch (err) {
        if (token !== loadToken) return;
        await swapContent(`<p>couldn’t load that post yet.</p>`);
      }
    });
  });
}


function escapeHtml(str) {
  return str.replace(/[&<>]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]
  ));
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer.observe(el));

const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");

// load saved preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  root.classList.add("light");
  toggle.textContent = "dark";
  updateWebringLogo();
}

toggle.addEventListener("click", () => {
  const isLight = root.classList.toggle("light");

  toggle.textContent = isLight ? "dark" : "light";
  localStorage.setItem("theme", isLight ? "light" : "dark");

  updateWebringLogo();
});

function updateWebringLogo() {
  const logo = document.getElementById("webring-logo");
  if (!logo) return;

  const isLight = document.documentElement.classList.contains("light");
  logo.src = isLight ? "public/img/webring.wine.svg" : "public/img/webring.green.svg";
}





/* BACKGROUND */
// ascii night sky on a hard character grid: three layers of twinkling stars
// (nearer layers parallax more as you scroll), a faint milky way, the odd
// shooting star. moving the cursor fast makes nearby stars flare
function initBackground() {
  const canvas = document.getElementById("bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GLYPHS = [".", "+", "*", "\\", "/"];
  const G = Object.fromEntries(GLYPHS.map((g, i) => [g, i]));
  const CELL = 16;    // px per character cell
  const FPS = 24;
  const STIR_R = 150; // px radius of the cursor's flare

  // far layer: lots of faint stars; near layer: a few bright ones
  const LAYERS = [
    { density: 0.016, parallax: 0.06, bright: 0.4 },
    { density: 0.006, parallax: 0.16, bright: 0.65 },
    { density: 0.002, parallax: 0.3, bright: 0.9 },
  ];

  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let atlas = null; // pre-rendered glyphs: row 0 in --fg, row 1 in --accent
  let t = 0;
  const mouse = { x: 0, y: 0, t: 0, seen: false, energy: 0 };
  const meteors = [];
  let nextMeteor = 4 + Math.random() * 6;
  let skyCache = LAYERS.map(() => new Map()); // layer -> sky row -> stars in it

  // deterministic per-cell randomness, so stars stay put between frames
  function hash(x, y) {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  // smooth value noise in 0..1 (and a few octaves of it), so nothing repeats
  function noise(x, y, seed) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
    const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
    const a = hash(xi + seed, yi);
    const b = hash(xi + 1 + seed, yi);
    const c = hash(xi + seed, yi + 1);
    const d = hash(xi + 1 + seed, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y, seed) {
    return noise(x, y, seed) * 0.57 + noise(x * 2.03, y * 2.03, seed + 101) * 0.29 + noise(x * 4.11, y * 4.11, seed + 211) * 0.14;
  }

  // 0..1, how deep into the milky way a sky cell is: a wandering, patchy band
  function band(col, skyRow) {
    const drift = (fbm(skyRow * 0.025, 0.5, 7) - 0.5) * cols * 0.6;
    const d = (col - cols * 0.6 + skyRow * 0.45 + drift) / (cols * 0.13 + 4);
    return Math.min(1, Math.exp(-d * d) * (0.3 + 1.1 * fbm(col * 0.11, skyRow * 0.11, 13)));
  }

  // the stars (and milky-way dust) in one row of one layer's sky; cached
  // since they never change, which leaves only the twinkle to do per frame
  function skyRowStars(li, skyRow) {
    const cache = skyCache[li];
    let list = cache.get(skyRow);
    if (list) return list;

    const layer = LAYERS[li];
    list = [];
    for (let col = 0; col < cols; col++) {
      const h = hash(col + li * 7919, skyRow);
      const milky = li === 0 ? band(col, skyRow) : 0;
      const clump = 2 * fbm(col * 0.05, skyRow * 0.05, 29 + li) ** 2; // clusters and voids
      const density = layer.density * clump * (1 + 4 * milky);

      if (h < density) {
        const mag = hash(col * 3 + li, skyRow * 5 + 1);
        const b = layer.bright * (0.35 + 0.65 * mag * mag);
        list.push({
          col,
          b,
          glyph: b < 0.3 ? "." : b < 0.62 ? "+" : "*",
          seed: Math.floor(hash(col + 11, skyRow + li * 31) * 1e6),
          rate: 0.4 + mag * 1.6 + hash(col, skyRow + 7) * 0.6,
        });
      } else if (milky > 0.3 && h < density + 0.08 * milky) {
        list.push({ col, dust: 0.035 * milky });
      }
    }
    cache.set(skyRow, list);
    return list;
  }

  function buildAtlas() {
    const css = getComputedStyle(document.documentElement);
    const colors = [css.getPropertyValue("--fg").trim(), css.getPropertyValue("--accent").trim()];

    atlas = document.createElement("canvas");
    atlas.width = GLYPHS.length * CELL * dpr;
    atlas.height = colors.length * CELL * dpr;
    const a = atlas.getContext("2d");
    a.scale(dpr, dpr);
    a.font = `11px "Aporetic", monospace`;
    a.textAlign = "center";
    a.textBaseline = "middle";
    colors.forEach((color, row) => {
      a.fillStyle = color;
      GLYPHS.forEach((ch, i) => a.fillText(ch, i * CELL + CELL / 2, row * CELL + CELL / 2));
    });
  }

  function put(glyph, accent, alpha, col, row) {
    const s = CELL * dpr;
    ctx.globalAlpha = Math.min(alpha, 0.85);
    ctx.drawImage(atlas, G[glyph] * s, accent ? s : 0, s, s, col * s, row * s, s, s);
  }

  function drawStars() {
    const r2 = STIR_R * STIR_R;

    LAYERS.forEach((layer, li) => {
      const shift = Math.floor((window.scrollY * layer.parallax) / CELL);

      for (let row = 0; row < rows; row++) {
        for (const star of skyRowStars(li, row + shift)) {
          if (star.dust) {
            put(".", false, star.dust, star.col, row);
            continue;
          }

          // irregular flicker: 1d noise over time, unique per star
          const tw = reduceMotion ? 1 : 0.5 + 0.5 * noise(t * star.rate, 0.5, star.seed);
          let glyph = star.glyph;
          if (glyph === "+" && tw > 0.93) glyph = "*"; // scintillation
          let alpha = star.b * tw * 0.38;
          let accent = false;

          if (mouse.energy > 0.01) {
            const dx = star.col * CELL + CELL / 2 - mouse.x;
            const dy = row * CELL + CELL / 2 - mouse.y;
            const stir = mouse.energy * Math.exp(-(dx * dx + dy * dy) / r2);
            alpha += stir * 0.35;
            if (stir > 0.35) {
              glyph = "*";
              accent = true;
            }
          }

          put(glyph, accent, alpha, star.col, row);
        }
      }
    });
  }

  function drawMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const age = t - m.born;
      if (age > m.life) {
        meteors.splice(i, 1);
        continue;
      }
      const fade = Math.min(age / 0.1, 1) * (1 - age / m.life);
      const trail = m.vx > 0 ? "\\" : "/";
      let prev = "";

      for (let k = 0; k < 8; k++) {
        const at = Math.max(age - k * 0.035, 0);
        const col = Math.round(m.x + m.vx * at);
        const row = Math.round(m.y + m.vy * at);
        if (`${col},${row}` === prev) continue;
        prev = `${col},${row}`;
        put(k === 0 ? "*" : trail, false, fade * 0.45 * (1 - k / 8), col, row);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawMeteors();
    ctx.globalAlpha = 1;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    cols = Math.ceil(window.innerWidth / CELL);
    rows = Math.ceil(window.innerHeight / CELL);
    skyCache = LAYERS.map(() => new Map());
    buildAtlas();
    draw();
  }

  window.addEventListener("resize", resize);
  // glyphs need re-rendering once the font loads and whenever the theme flips
  document.fonts?.ready.then(() => { buildAtlas(); draw(); });
  new MutationObserver(() => { buildAtlas(); draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  resize();

  if (reduceMotion) {
    // still sky, but keep the parallax honest
    window.addEventListener("scroll", () => requestAnimationFrame(draw), { passive: true });
    return;
  }

  window.addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (mouse.seen && e.pointerType === "mouse") {
      const speed = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y) / Math.max(now - mouse.t, 1);
      mouse.energy = Math.min(1, mouse.energy + speed * 0.05);
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.t = now;
    mouse.seen = true;
  }, { passive: true });

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 1000 / FPS) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    t = now / 1000;
    mouse.energy *= Math.pow(0.1, dt); // settles within about a second

    if (t > nextMeteor) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      meteors.push({
        x: cols * (0.15 + Math.random() * 0.7),
        y: rows * Math.random() * 0.45,
        vx: dir * (20 + Math.random() * 12),
        vy: 9 + Math.random() * 6,
        born: t,
        life: 0.6 + Math.random() * 0.5,
      });
      nextMeteor = t + 6 + Math.random() * 9;
    }

    draw();
  }
  requestAnimationFrame(frame);
}



/* PROJECTS */
// vertical deck: hovering (or scrolling under the cursor) flips cards open,
// everything moves on springs so it overshoots & settles like a physical stack
function initProjects() {
  const deck = document.querySelector(".projects");
  const section = document.getElementById("projects-section");
  if (!deck) return;

  const projects = [
    { href: "https://www.macwebring.xyz/", img: "public/img/projects/mac-webring.png", name: "mac-webring", },
    { href: "https://github.com/antjng/cinerate", img: "public/img/projects/cinerate.png", name: "cinerate", },
    { href: "https://github.com/antjng/csv-search", img: "public/img/projects/csv-search.png", name: "csv-search", },
    { href: "https://github.com/antjng/hold-up", img: "public/img/projects/hold-up.png", name: "hold-up", },
    { href: "https://github.com/antjng/armoire", img: "public/img/projects/armoire.png", name: "armoire", },
    { href: "https://github.com/antjng/2048-c", img: "public/img/projects/2048.png", name: "2048-c", },
    { href: "https://github.com/antjng/chromaview", img: "public/img/projects/chromaview.png", name: "chromaview", },
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spring = () => ({ x: 0, v: 0 });
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  deck.innerHTML = "";

  const cards = projects.map((p, i) => {
    const el = document.createElement("div");
    el.className = "project";

    // reveal wrapper (uses the site's .hidden -> .show slide-in)
    const card = document.createElement("div");
    card.className = "project-card hidden";
    card.style.transitionDelay = `${i * 90}ms`;

    const a = document.createElement("a");
    a.href = p.href;
    a.target = "_blank";

    const url = new URL(p.href);
    const host = (url.host.replace(/^www\./, "") + url.pathname).replace(/\/$/, "");

    const tab = document.createElement("div");
    tab.className = "project-tab";
    tab.innerHTML = `
      <span class="project-num">${String(projects.length - i).padStart(2, "0")}</span>
      <span class="project-name">${p.name}</span>
      <span class="project-host">${host}</span>
      <span class="project-arrow">&#8599;</span>`;

    const media = document.createElement("div");
    media.className = "project-media";

    const img = document.createElement("img");
    img.src = p.img;
    img.alt = p.name;

    media.appendChild(img);
    a.appendChild(tab);
    a.appendChild(media);
    card.appendChild(a);
    el.appendChild(card);
    deck.appendChild(el);

    observer.observe(card);

    const c = {
      el, a, img,
      y: spring(), h: spring(), rx: spring(), ry: spring(), ix: spring(), iy: spring(),
      target: { y: 0, h: 0, rx: 0, ry: 0, ix: 0, iy: 0 },
    };

    // touch: first tap opens the card, second tap follows the link
    a.addEventListener("click", (e) => {
      if (lastPointerType !== "mouse" && i !== open) {
        e.preventDefault();
        setOpen(i);
      }
    });
    a.addEventListener("focus", () => {
      if (a.matches(":focus-visible")) setOpen(i);
    });

    return c;
  });

  let open = 0;
  let dealt = reduceMotion; // cards start stacked at y=0, then deal out
  let tabH = 0;
  let cardH = 0;
  let width = 0;
  let pointer = null;
  let pointerInside = false;
  let lastPointerType = "mouse";

  cards[open].el.classList.add("open");

  // resting y of card i given the current open card
  const topOf = (i) => i * tabH + (i > open ? cardH - tabH : 0);

  // cards up to the open one are hidden behind it; cards after it only reach
  // the bottom of the deck (otherwise their images hang off it over the footer)
  const heightOf = (i) => (i <= open ? cardH : (cards.length - i) * tabH);

  function layout() {
    if (deck.clientWidth === width) return;
    const first = width === 0;
    width = deck.clientWidth;

    tabH = parseFloat(getComputedStyle(deck).getPropertyValue("--tab-h")) || 40;
    const imgH = Math.round(width / (width < 500 ? 1.6 : 2));
    deck.style.setProperty("--img-h", `${imgH}px`);
    cardH = tabH + imgH;
    deck.style.height = `${(cards.length - 1) * tabH + cardH}px`;
    retarget();
    if (first) cards.forEach((c) => (c.h.x = c.target.h));
  }

  function retarget() {
    cards.forEach((c, i) => {
      c.target.y = dealt ? topOf(i) : 0;
      c.target.h = heightOf(i);
      if (i !== open) Object.assign(c.target, { rx: 0, ry: 0, ix: 0, iy: 0 });
    });
    kick();
  }

  function setOpen(i) {
    if (i === open) return;
    cards[open].el.classList.remove("open");
    open = i;
    cards[open].el.classList.add("open");
    retarget();
  }

  // figure out which card is under the cursor + tilt it toward the cursor
  function track() {
    if (!pointer || !dealt || section?.style.visibility === "hidden") return;
    const r = deck.getBoundingClientRect();
    const x = pointer.x - r.left;
    const y = pointer.y - r.top;
    const inside = x >= 0 && x <= r.width && y >= 0 && y <= r.height;

    if (inside) {
      let i = cards.length - 1;
      while (i > 0 && topOf(i) > y) i--;
      setOpen(i);

      if (!reduceMotion) {
        const px = x / r.width;
        const py = clamp((y - topOf(open)) / cardH, 0, 1);
        Object.assign(cards[open].target, {
          rx: (0.5 - py) * 6,
          ry: (px - 0.5) * 8,
          ix: (0.5 - px) * 14,
          iy: (0.5 - py) * 10,
        });
      }
      kick();
    } else if (pointerInside) {
      Object.assign(cards[open].target, { rx: 0, ry: 0, ix: 0, iy: 0 });
      kick();
    }
    pointerInside = inside;
  }

  /* physics loop: only runs while something is moving */
  const spread = spring(); // how far the deck fans out from scroll velocity
  let running = false;
  let lastT = 0;
  let lastScroll = 0;
  let scrollV = 0;

  // damped spring step; returns true while still moving
  function step(s, target, k, c, dt) {
    if (reduceMotion) {
      s.x = target;
      s.v = 0;
      return false;
    }
    s.v += (k * (target - s.x) - c * s.v) * dt;
    s.x += s.v * dt;
    if (Math.abs(target - s.x) < 0.01 && Math.abs(s.v) < 0.01) {
      s.x = target;
      s.v = 0;
      return false;
    }
    return true;
  }

  function kick() {
    if (running) return;
    running = true;
    lastT = performance.now();
    lastScroll = window.scrollY;
    requestAnimationFrame(frame);
  }

  function frame(now) {
    const dt = clamp((now - lastT) / 1000, 0, 1 / 30);
    lastT = now;

    const sy = window.scrollY;
    scrollV += ((sy - lastScroll) / Math.max(dt, 1 / 240) - scrollV) * 0.3;
    lastScroll = sy;

    let moving = step(spread, reduceMotion ? 0 : clamp(scrollV * 0.004, -6, 6), 140, 16, dt);
    const last = cards.length - 1;

    cards.forEach((c, i) => {
      const t = c.target;
      moving = step(c.y, t.y, 260, 24, dt) | moving;
      moving = step(c.h, t.h, 260, 24, dt) | moving;
      moving = step(c.rx, t.rx, 180, 18, dt) | moving;
      moving = step(c.ry, t.ry, 180, 18, dt) | moving;
      moving = step(c.ix, t.ix, 120, 16, dt) | moving;
      moving = step(c.iy, t.iy, 120, 16, dt) | moving;

      // scrolling down fans cards downward from the top, scrolling up fans them upward
      const fan = spread.x > 0 ? spread.x * i : spread.x * (last - i);

      c.el.style.transform = `translate3d(0, ${c.y.x + fan}px, 0)`;
      c.a.style.height = `${Math.max(tabH, c.h.x)}px`;
      c.a.style.transform = `rotateX(${c.rx.x}deg) rotateY(${c.ry.x}deg)`;
      c.img.style.transform = `translate3d(${c.ix.x}px, ${c.iy.x}px, 0) scale(1.08)`;
    });

    if (moving || Math.abs(scrollV) > 1) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  window.addEventListener("pointermove", (e) => {
    lastPointerType = e.pointerType;
    if (e.pointerType !== "mouse") return;
    pointer = { x: e.clientX, y: e.clientY };
    track();
  });

  deck.addEventListener("pointerdown", (e) => {
    lastPointerType = e.pointerType;
  });

  // scrolling with a still cursor scrubs through the deck too
  window.addEventListener("scroll", () => {
    if (section?.style.visibility === "hidden") return;
    track();
    kick();
  }, { passive: true });

  new ResizeObserver(layout).observe(deck);
  layout();

  // deal the cards out the first time the deck comes into view
  if (!dealt) {
    const dealObserver = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      dealObserver.disconnect();
      setTimeout(() => {
        dealt = true;
        retarget();
        track();
      }, 350);
    });
    dealObserver.observe(deck);
  }
}



/* MUSIC */
// a crate of top albums from last.fm. drag down to pull records toward you,
// up to push them back. each record chases its slot on its own spring (looser
// the further back it is), so a fast flick ripples through the crate
const LASTFM_USER = "jjjjiang";
const LASTFM_KEY = "494612dc91f88b72cff800f37ea904b7"; // read-only, safe to ship (never put the shared secret here)
const LASTFM_BLANK = "2a96cbd8b46e442fc41c2b86b821562f"; // last.fm's grey-star placeholder

async function fetchTopAlbums(period) {
  const cacheKey = `lastfm:${period}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.albums;
  } catch (_) { }

  const params = new URLSearchParams({
    method: "user.gettopalbums",
    user: LASTFM_USER,
    period,
    limit: "20",
    api_key: LASTFM_KEY,
    format: "json",
  });
  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.message || "last.fm error");

  const albums = (data.topalbums?.album || []).map((a) => {
    const img = (a.image || []).map((im) => im["#text"]).filter(Boolean).pop() || "";
    return {
      name: a.name,
      artist: a.artist?.name || "",
      plays: Number(a.playcount) || 0,
      url: a.url,
      img: img.includes(LASTFM_BLANK) ? "" : img.replace("/300x300/", "/600x600/"), // sharper on retina
    };
  });

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), albums }));
  } catch (_) { }
  return albums;
}

function initMusic() {
  const crate = document.getElementById("crate");
  const stage = crate?.querySelector(".crate-stage");
  const info = document.getElementById("crate-info");
  const periods = document.querySelectorAll(".crate-period");
  if (!crate || !stage || !info) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const pad = (n) => String(n).padStart(2, "0");

  const STEP = 70;    // px of drag per record
  const GAP = 24;     // depth between standing records
  const RISE = 9;     // standing records peek up over the ones in front
  const LEAN = 10;    // standing records lean back this many degrees
  const NUDGE = 0.12; // how far the front record tips toward you on hover

  let records = []; // { el, shade, album, d: { x, v } }  d = offset from the front
  let p = 0;        // fractional index of the record facing you
  let pv = 0;
  let target = 0;
  let current = -1;
  let hovering = false;
  let dragging = null;
  let loadToken = 0;

  /* data */
  function message(text) {
    records = [];
    stage.innerHTML = "";
    info.innerHTML = "";
    const msg = document.createElement("p");
    msg.textContent = text;
    info.appendChild(msg);
  }

  async function load(period) {
    const token = ++loadToken;
    periods.forEach((b) => b.classList.toggle("active", b.dataset.period === period));

    if (!LASTFM_KEY) {
      message("( no last.fm api key yet )");
      return;
    }

    try {
      const albums = await fetchTopAlbums(period);
      if (token !== loadToken) return;
      if (!albums.length) message("nothing scrobbled in this stretch.");
      else build(albums);
    } catch (_) {
      if (token === loadToken) message("couldn't reach last.fm right now.");
    }
  }

  function build(albums) {
    stage.innerHTML = "";
    p = 0;
    pv = 0;
    target = 0;
    current = -1;

    records = albums.map((album, i) => {
      const el = document.createElement("div");
      el.className = "record";

      if (album.img) {
        const img = document.createElement("img");
        img.src = album.img;
        img.alt = `${album.name} by ${album.artist}`;
        img.draggable = false;
        el.appendChild(img);
      } else {
        const blank = document.createElement("div");
        blank.className = "record-blank";
        blank.textContent = `${album.name} / ${album.artist}`;
        el.appendChild(blank);
      }

      const shade = document.createElement("div");
      shade.className = "record-shade";
      el.appendChild(shade);
      stage.appendChild(el);

      // start deep in the crate so the records slide forward into place
      return { el, shade, album, d: { x: reduceMotion ? i : i + 6 + i * 0.4, v: 0 } };
    });

    kick();
  }

  function showInfo(i) {
    const { album } = records[i];
    info.innerHTML = "";

    const link = document.createElement("a");
    link.href = album.url;
    link.target = "_blank";
    link.textContent = `${album.name} ↗`;

    const meta = document.createElement("div");
    meta.className = "crate-meta";
    meta.textContent = `${album.artist} · ${album.plays.toLocaleString()} plays · ${pad(i + 1)}/${pad(records.length)}`;

    info.append(link, meta);
  }

  /* rendering */
  function place(rec) {
    const d = rec.d.x;
    let angle, y = 0, z, shade, opacity;

    if (d >= 0) {
      // standing in the crate, receding into the back
      angle = LEAN;
      y = -d * RISE;
      z = -d * GAP;
      shade = Math.min(d * 0.14, 0.75);
      opacity = clamp(6 - d, 0, 1);
    } else {
      // flipped forward toward you, leaning on the front of the crate
      const t = Math.min(-d, 1);
      const eased = t * t * (3 - 2 * t);
      angle = LEAN - eased * (LEAN + 62);
      z = -d * GAP * 0.6;
      shade = eased * 0.8;
      opacity = clamp(4 + d, 0, 1);
    }

    rec.el.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${angle}deg)`;
    rec.el.style.zIndex = String(1000 - Math.round(d * 10));
    rec.el.style.opacity = opacity;
    rec.el.style.visibility = opacity <= 0 ? "hidden" : "";
    rec.shade.style.opacity = shade;
  }

  /* physics loop: only runs while something is moving */
  let running = false;
  let lastT = 0;

  function kick() {
    if (running) return;
    running = true;
    lastT = performance.now();
    requestAnimationFrame(frame);
  }

  function frame(now) {
    const dt = clamp((now - lastT) / 1000, 0, 1 / 30);
    lastT = now;
    let moving = !!dragging;

    if (!dragging) {
      const goal = target + (hovering && !reduceMotion ? NUDGE : 0);
      if (reduceMotion) {
        p = goal;
        pv = 0;
      } else {
        pv += (170 * (goal - p) - 22 * pv) * dt;
        p += pv * dt;
        if (Math.abs(goal - p) < 0.0005 && Math.abs(pv) < 0.0005) {
          p = goal;
          pv = 0;
        } else {
          moving = true;
        }
      }
    }

    records.forEach((rec, i) => {
      const goal = i - p;
      const s = rec.d;
      if (reduceMotion) {
        s.x = goal;
        s.v = 0;
      } else {
        // records further from the front are looser, so motion ripples back
        const k = 420 / (1 + 0.4 * Math.abs(goal));
        s.v += (k * (goal - s.x) - 1.5 * Math.sqrt(k) * s.v) * dt;
        s.x += s.v * dt;
        if (Math.abs(goal - s.x) < 0.0005 && Math.abs(s.v) < 0.0005) {
          s.x = goal;
          s.v = 0;
        } else {
          moving = true;
        }
      }
      place(rec);
    });

    if (records.length) {
      const idx = clamp(Math.round(p), 0, records.length - 1);
      if (idx !== current) {
        current = idx;
        showInfo(idx);
      }
    }

    if (moving) requestAnimationFrame(frame);
    else running = false;
  }

  function flipTo(i) {
    if (!records.length) return;
    target = clamp(i, 0, records.length - 1);
    kick();
  }

  /* input */
  crate.addEventListener("pointerdown", (e) => {
    if (!records.length || e.button !== 0) return;
    crate.setPointerCapture?.(e.pointerId);
    crate.classList.add("dragging");
    dragging = { y0: e.clientY, p0: p, t: performance.now(), moved: false };
    pv = 0;
    kick();
  });

  crate.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - dragging.y0;
    if (Math.abs(dy) > 4) dragging.moved = true;

    // rubber-band past either end of the crate
    const max = records.length - 1;
    const raw = dragging.p0 + dy / STEP;
    const next = raw < 0 ? raw * 0.3 : raw > max ? max + (raw - max) * 0.3 : raw;

    const now = performance.now();
    const dt = Math.max((now - dragging.t) / 1000, 1 / 240);
    pv = pv * 0.6 + ((next - p) / dt) * 0.4;
    p = next;
    dragging.t = now;
  });

  function release() {
    if (!dragging) return;
    crate.classList.remove("dragging");
    const { moved, t } = dragging;
    dragging = null;

    if (!moved) {
      // tap: flip one forward, or ripple all the way back from the end
      flipTo(target >= records.length - 1 ? 0 : target + 1);
      return;
    }
    if (performance.now() - t > 80) pv = 0; // held still before letting go
    flipTo(Math.round(p + pv * 0.15));
  }

  crate.addEventListener("pointerup", release);
  crate.addEventListener("pointercancel", release);

  crate.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return;
    hovering = true;
    kick();
  });
  crate.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    hovering = false;
    kick();
  });

  crate.addEventListener("keydown", (e) => {
    if (!records.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") flipTo(target + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") flipTo(target - 1);
    else if (e.key === "Enter") window.open(records[current].album.url, "_blank", "noopener");
    else return;
    e.preventDefault();
  });

  periods.forEach((b) => b.addEventListener("click", () => load(b.dataset.period)));

  // size records to the column
  new ResizeObserver(() => {
    const size = clamp(Math.round(crate.clientWidth * 0.5), 150, 260);
    crate.style.setProperty("--record-size", `${size}px`);
  }).observe(crate);

  load("1month");
}



function initRevealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  });

  document.querySelectorAll(".hidden").forEach((el) => observer.observe(el));
}



function initStaticUI() {
  const webring = document.getElementById("webring");

  if (webring) webring.style.opacity = 1;
}
