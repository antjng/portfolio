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
      emmisive: new THREE.Color(0xffffff),
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
});

function initBlog() {
  const links = document.querySelectorAll('.blog-post-link');
  const content = document.getElementById('blog-content');
  if (!links.length || !content) return;

  links.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const slug = link.dataset.post;
      if (!slug) return;

      try {
        const res = await fetch(`public/posts/${slug}.md`);
        if (!res.ok) throw new Error('not found');
        const text = await res.text();

        if (window.marked) {
          content.innerHTML = window.marked.parse(text);
        } else {
          content.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
        }
      } catch (err) {
        content.innerHTML = `<p>couldn’t load that post yet.</p>`;
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



/* PROJECTS */
function initProjects() {
  const container = document.querySelector(".projects");
  if (!container) return;

  const projects = [
    {href: "https://github.com/antjng/cinerate", img: "public/img/projects/cinerate.png", alt: "cinerate",},
    {href: "https://github.com/antjng/csv-search", img: "public/img/projects/csv-search.png", alt: "csv-search",},
    {href: "https://github.com/antjng/hold-up", img: "public/img/projects/hold-up.png", alt: "hold-up",},
    {href: "https://github.com/antjng/armoire", img: "public/img/projects/armoire.png", alt: "armoire",},
    {href: "https://github.com/antjng/2048-c", img: "public/img/projects/2048.png", alt: "2048inC",},
  ];

  container.innerHTML = "";

  projects.forEach((p, i) => {
    const proj = document.createElement("div");
    proj.className = "project hidden";
    proj.style.setProperty("--i", String(i));

    proj.onmouseover = () => {
      try { window.fixdelay?.(i); } catch (_) { }
    };

    const a = document.createElement("a");
    a.href = p.href;
    a.target = "_blank";

    const img = document.createElement("img");
    img.src = p.img;
    img.alt = p.alt || "";

    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const arrow = document.createElement("div");
    arrow.className = "arrow";
    arrow.innerHTML = "&#8599;";

    a.appendChild(img);
    a.appendChild(overlay);
    a.appendChild(arrow);
    proj.appendChild(a);
    container.appendChild(proj);

    observer.observe(proj);
  });
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

  // function openLightbox(p) {
  //   if (!lightbox || !lbImg || !lbCap) return;
  //   lbImg.src = p.src;
  //   lbImg.alt = p.alt || "";
  //   const cap = p.caption || "";
  //   lbCap.textContent = cap;
  //   lbCap.style.display = cap ? "" : "none";
  //   lightbox.classList.add("open");
  //   lightbox.setAttribute("aria-hidden", "false");
  //   document.body.style.overflow = "hidden";
  // }

  // function closeLightbox() {
  //   if (!lightbox || !lbImg || !lbCap) return;
  //   lightbox.classList.remove("open");
  //   lightbox.setAttribute("aria-hidden", "true");
  //   lbImg.src = "";
  //   lbCap.textContent = "";
  //   lbCap.style.display = "";
  //   document.body.style.overflow = "";
  // }

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
  const left = document.getElementById("leftarrow");
  const right = document.getElementById("rightarrow");
  const webring = document.getElementById("webring");

  if (left) left.style.opacity = 1;
  if (right) right.style.opacity = 1;
  if (webring) webring.style.opacity = 1;
}
