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
    return new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.18,
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
  initCube();
  initProjects();
  initBlog();
  initPhotos();
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
      <span class="project-num">${String(i + 1).padStart(2, "0")}</span>
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
      y: spring(), rx: spring(), ry: spring(), ix: spring(), iy: spring(),
      target: { y: 0, rx: 0, ry: 0, ix: 0, iy: 0 },
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

  function layout() {
    if (deck.clientWidth === width) return;
    width = deck.clientWidth;

    tabH = parseFloat(getComputedStyle(deck).getPropertyValue("--tab-h")) || 40;
    const imgH = Math.round(width / (width < 500 ? 1.6 : 2));
    deck.style.setProperty("--img-h", `${imgH}px`);
    cardH = tabH + imgH;
    deck.style.height = `${(cards.length - 1) * tabH + cardH}px`;
    retarget();
  }

  function retarget() {
    cards.forEach((c, i) => {
      c.target.y = dealt ? topOf(i) : 0;
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
      moving = step(c.rx, t.rx, 180, 18, dt) | moving;
      moving = step(c.ry, t.ry, 180, 18, dt) | moving;
      moving = step(c.ix, t.ix, 120, 16, dt) | moving;
      moving = step(c.iy, t.iy, 120, 16, dt) | moving;

      // scrolling down fans cards downward from the top, scrolling up fans them upward
      const fan = spread.x > 0 ? spread.x * i : spread.x * (last - i);

      c.el.style.transform = `translate3d(0, ${c.y.x + fan}px, 0)`;
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



/* PHOTOS */
function initPhotos() {
  const grid = document.getElementById("photos-grid");
  if (!grid) return;

  const photos = [
    { src: "public/img/photos/photo1.jpg", alt: "photo 1", caption: "shanghai" },
    { src: "public/img/photos/photo2.jpg", alt: "photo 2", caption: "distillery district" },
    { src: "public/img/photos/photo3.jpg", alt: "photo 3", caption: "exams" },
    { src: "public/img/photos/photo4.jpg", alt: "photo 4", caption: "residence" },
    { src: "public/img/photos/photo5.jpg", alt: "photo 5", caption: "vancouver" },
    { src: "public/img/photos/photo6.jpg", alt: "photo 6", caption: "sunny cali" },
  ];

  const lightbox = document.getElementById("photo-lightbox");
  const lbImg = document.getElementById("photo-lightbox-img");
  const lbCap = document.getElementById("photo-lightbox-caption");
  const closeBtn = document.getElementById("photo-close");

  function openLightbox(p) {
    if (!lightbox || !lbImg || !lbCap) return;
    lbImg.src = p.src;
    lbImg.alt = p.alt || "";
    const cap = p.caption || "";
    lbCap.textContent = cap;
    lbCap.style.display = cap ? "" : "none";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lbImg || !lbCap) return;
    if (!lightbox.classList.contains("open")) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lbImg.removeAttribute("src");
    lbCap.textContent = "";
    lbCap.style.display = "";
    document.body.style.overflow = "";
  }

  photos.forEach((p) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    card.tabIndex = 0;

    const img = document.createElement("img");
    img.className = "photo-img";
    img.src = p.src;
    img.alt = p.alt || "";
    img.loading = "lazy";

    card.appendChild(img);

    if (p.caption) {
      const cap = document.createElement("div");
      cap.className = "photo-caption";
      cap.textContent = p.caption;
      card.appendChild(cap);
    }

    const open = () => openLightbox(p);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    grid.appendChild(card);
  });

  closeBtn?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
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
