/* ============================================================
   choyon.dev — interactions + Three.js 3D hero
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  if (burger) burger.addEventListener('click', function () { links.classList.toggle('open'); });
  if (links) links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); }); });

  /* ---------- scroll: nav bg + progress bar ---------- */
  var bar = document.querySelector('.scroll-progress i');
  function onScroll() {
    var s = window.scrollY || 0;
    if (nav) nav.classList.toggle('scrolled', s > 30);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (s / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- animated counters ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, target = +el.dataset.count, t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1100, 1);
        el.textContent = Math.round(p * target);
        if (p < 1) requestAnimationFrame(step); else el.textContent = target + '+';
      })(performance.now());
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------- cursor glow + card spotlight + tilt ---------- */
  var glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', function (ev) {
    if (glow) { glow.style.left = ev.clientX + 'px'; glow.style.top = ev.clientY + 'px'; }
  }, { passive: true });

  document.querySelectorAll('.skill-card, .project').forEach(function (card) {
    card.addEventListener('pointermove', function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      if (!reduce) {
        var rx = ((ev.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((ev.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
      }
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  });

  /* ---------- Three.js 3D hero ---------- */
  var canvas = document.getElementById('hero3d');
  if (canvas && window.THREE) {
    try { init3D(canvas); } catch (e) { /* graceful: background stays */ }
  }

  function init3D(cv) {
    var THREE = window.THREE;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, cv.clientWidth / cv.clientHeight, 0.1, 100);
    camera.position.z = 6.2;
    var renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var group = new THREE.Group(); scene.add(group);

    // glowing wireframe icosahedron
    var geo = new THREE.IcosahedronGeometry(2.1, 1);
    var wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.7 })
    );
    group.add(wire);
    var glassy = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x151a3a, transparent: true, opacity: 0.06 }));
    group.add(glassy);

    // vertex dots
    var dotsMat = new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.06 });
    group.add(new THREE.Points(geo, dotsMat));

    // floating particle field
    var N = 340, pos = new Float32Array(N * 3);
    for (var i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 18;
    var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var field = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x8b8fb5, size: 0.03, transparent: true, opacity: 0.6 }));
    scene.add(field);

    var mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    function resize() {
      var w = cv.clientWidth, h = cv.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();

    var t = 0;
    function loop() {
      requestAnimationFrame(loop);
      t += 0.005;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      group.rotation.y += 0.0026; group.rotation.x = my * 0.6 + Math.sin(t) * 0.06;
      group.rotation.z = mx * 0.3;
      group.position.x = mx * 0.8;
      field.rotation.y -= 0.0006;
      renderer.render(scene, camera);
    }
    if (reduce) { renderer.render(scene, camera); } else { loop(); }
  }
})();
