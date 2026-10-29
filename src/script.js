// Menú móvil
const toggle = document.getElementById('menuToggle');
const nav = document.getElementById('siteNav');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Cerrar' : 'Menú';
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menú';
  });
});

// Borde del header al hacer scroll
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Link activo según la sección visible
const links = [...nav.querySelectorAll('a[href^="#"]')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));

// Año del footer
document.getElementById('year').textContent = new Date().getFullYear();

/* ==================== ENGRANAJES ====================
   Cada engranaje es una parte del trabajo. Todos tienen el mismo módulo
   (tamaño de diente), así que engranan de verdad: el más chico gira más
   rápido y cada par gira en sentido contrario. */
const svg = document.getElementById('gears');
const NS = 'http://www.w3.org/2000/svg';
const MODULE = 9;

const GEARS = [
  {
    id: 'frontend', name: 'Frontend', teeth: 20, x: 250, y: 250, label: 128,
    desc: 'Interfaces en React, Next.js, Angular y Vue: rápidas, accesibles y fieles al diseño.',
    tools: 'React, Next.js, Angular, Vue, TypeScript, Tailwind',
  },
  {
    id: 'diseno', name: 'Diseño', teeth: 12, parent: 0, dir: 215, label: 190,
    desc: 'Investigo con usuarios, prototipo en Figma y defino la interfaz antes de escribir código.',
    tools: 'Figma, investigación UX, prototipos, design systems, WCAG',
  },
  {
    id: 'backend', name: 'Backend', teeth: 15, parent: 0, dir: 20, label: -60,
    desc: 'APIs REST con NestJS y Sails.js sobre MySQL, con control de acceso por roles.',
    tools: 'Node.js, NestJS, Sails.js, APIs REST, MySQL',
  },
  {
    id: 'cloud', name: 'Cloud', teeth: 22, parent: 2, dir: 78, label: 150,
    desc: 'Contenedores Docker, CI/CD y servidores en AWS o VPS. Me hago cargo después del lanzamiento.',
    tools: 'AWS (EC2), Docker, GitLab CI, Azure DevOps, VPS',
  },
];

const rad = d => d * Math.PI / 180;

function gearPath(teeth) {
  const r = MODULE * teeth / 2;         // radio primitivo
  const ra = r + MODULE;                // punta del diente
  const rf = r - MODULE * 1.2;          // raíz
  const p = 2 * Math.PI / teeth;
  const pt = (rr, a) => `${(rr * Math.cos(a)).toFixed(2)} ${(rr * Math.sin(a)).toFixed(2)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    d += (i ? 'L' : 'M') + pt(rf, a - p * .5)
      + 'L' + pt(rf, a - p * .26)
      + 'L' + pt(ra, a - p * .13)
      + 'L' + pt(ra, a + p * .13)
      + 'L' + pt(rf, a + p * .26);
  }
  d += 'Z';
  // aro interior y perforaciones, para que se lea como pieza mecánica
  const hub = Math.max(14, r * .28);
  const ring = rf - 10;
  d += circle(hub);
  if (teeth >= 14) {
    const holes = teeth >= 20 ? 6 : 5;
    const mid = (hub + ring) / 2;
    const hr = Math.min((ring - hub) / 2 - 5, mid * Math.sin(Math.PI / holes) - 6);
    for (let k = 0; k < holes; k++) {
      const a = k * 2 * Math.PI / holes;
      d += circle(hr, mid * Math.cos(a), mid * Math.sin(a));
    }
  }
  return d;
}

function circle(r, cx = 0, cy = 0) {
  return `M${(cx + r).toFixed(2)} ${cy.toFixed(2)}a${r} ${r} 0 1 0 ${(-2 * r).toFixed(2)} 0a${r} ${r} 0 1 0 ${(2 * r).toFixed(2)} 0Z`;
}

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

if (svg) {
  // Posición de cada engranaje a partir de su "padre": la distancia entre
  // centros es la suma de los radios primitivos, como en una caja real.
  GEARS.forEach(g => {
    g.r = MODULE * g.teeth / 2;
    if (g.parent === undefined) return;
    const p = GEARS[g.parent];
    const dist = p.r + g.r + 1;
    g.x = p.x + dist * Math.cos(rad(g.dir));
    g.y = p.y + dist * Math.sin(rad(g.dir));
  });

  GEARS.forEach((g, i) => {
    const group = el('g', {
      class: 'gear', tabindex: '0', role: 'button',
      'aria-label': `${g.name}: ver qué hago`, 'data-index': i,
    }, svg);
    g.rotor = el('g', { transform: `translate(${g.x} ${g.y})` }, group);
    g.spin = el('g', {}, g.rotor);
    el('path', { class: 'gear-body', d: gearPath(g.teeth), 'fill-rule': 'evenodd' }, g.spin);
    el('circle', { class: 'gear-pitch', r: g.r, cx: 0, cy: 0 }, g.rotor);
    el('circle', { class: 'gear-axle', r: 5, cx: 0, cy: 0 }, g.rotor);
    const out = rad(g.label); // hacia un lado libre, para que nada la tape
    const far = g.r + MODULE + 14;
    const c = Math.cos(out);
    const label = el('text', {
      class: 'gear-label',
      x: g.x + far * c,
      y: g.y + far * Math.sin(out) + 6 + 10 * Math.sin(out),
      // el texto crece hacia afuera del engranaje, nunca hacia adentro
      'text-anchor': c < -0.3 ? 'end' : c > 0.3 ? 'start' : 'middle',
    }, group);
    label.textContent = g.name;
    g.node = group;
  });

  // Ajusta el viewBox al mecanismo completo (con aire para las etiquetas)
  const box = svg.getBBox();
  const pad = 24;
  svg.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`);

  // Ángulo de cada engranaje en función del primero, con el desfase
  // de medio diente que hace que los dientes calcen.
  function angles(base) {
    const a = [base];
    GEARS.forEach((g, i) => {
      if (g.parent === undefined) return;
      const p = GEARS[g.parent];
      const phi = rad(g.dir);
      a[i] = -(p.teeth / g.teeth) * (a[g.parent] - phi) + phi + Math.PI + Math.PI / g.teeth;
    });
    return a;
  }

  function draw(base) {
    angles(base).forEach((a, i) => {
      GEARS[i].spin.setAttribute('transform', `rotate(${(a * 180 / Math.PI).toFixed(3)})`);
    });
  }

  // Selección: muestra qué hago en esa parte
  const nameEl = document.getElementById('gearName');
  const descEl = document.getElementById('gearDesc');
  const toolsEl = document.getElementById('gearTools');

  function select(i) {
    GEARS.forEach((g, k) => {
      g.node.classList.toggle('is-active', k === i);
      g.node.setAttribute('aria-pressed', String(k === i));
    });
    nameEl.textContent = GEARS[i].name;
    descEl.textContent = GEARS[i].desc;
    toolsEl.textContent = GEARS[i].tools;
  }

  svg.addEventListener('click', e => {
    const g = e.target.closest('.gear');
    if (g) select(Number(g.dataset.index));
  });
  svg.addEventListener('keydown', e => {
    const g = e.target.closest('.gear');
    if (!g) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(Number(g.dataset.index));
    }
  });
  select(0);

  // Movimiento: giro lento continuo + el scroll empuja el mecanismo.
  // Con "reducir movimiento" activado queda quieto.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pauseBtn = document.getElementById('gearPause');
  let paused = reduce.matches;
  let angle = 0;
  let last = performance.now();
  let lastScroll = window.scrollY;

  function setPaused(value) {
    paused = value;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Reanudar' : 'Pausar';
  }
  setPaused(paused);
  pauseBtn.addEventListener('click', () => setPaused(!paused));

  function frame(now) {
    const dt = Math.min(now - last, 64);
    const ds = window.scrollY - lastScroll;
    last = now;
    lastScroll = window.scrollY;
    if (!paused) {
      angle += dt * 0.00018;  // giro lento, cerca de una vuelta por minuto
      angle += ds * 0.0022;   // el scroll empuja el mecanismo
      draw(angle);
    }
  }

  // Solo anima mientras el mecanismo está en pantalla
  let running = false;
  function loop(t) {
    if (!running) return;
    frame(t);
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      last = performance.now();
      lastScroll = window.scrollY;
      requestAnimationFrame(loop);
    } else if (!entry.isIntersecting) {
      running = false;
    }
  }).observe(svg);

  draw(0);
}
