const lines = window.NULL_DO_LINES || ['先不用解决所有事。'];

const lineEl = document.getElementById('line');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const solarLabel = document.getElementById('solarLabel');
const solarTimes = document.getElementById('solarTimes');
const canvas = document.getElementById('solarCanvas');
const ctx = canvas.getContext('2d');
const root = document.documentElement;

const pad = n => String(n).padStart(2, '0');
const fmt = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}

function pickLine(animate = false) {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const nextLine = lines[hashString(key) % lines.length];

  if (animate) {
    lineEl.classList.add('is-refreshing');
    setTimeout(() => {
      lineEl.textContent = nextLine;
      lineEl.classList.remove('is-refreshing');
    }, 220);
  } else {
    lineEl.textContent = nextLine;
  }
}

function updateClock() {
  const now = new Date();
  timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(c1, c2, t) {
  const a = c1.match(/\w\w/g).map(x => parseInt(x, 16));
  const b = c2.match(/\w\w/g).map(x => parseInt(x, 16));
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

function setPalette(mode, progress = 0.5) {
  const day = {
    bg1: 'eef4f8', bg2: 'e7efe8', bg3: 'f7f2ea', ink: 'rgba(25,34,41,.82)', soft: 'rgba(25,34,41,.42)',
    a: 'rgba(255,255,255,.66)', b: 'rgba(220,230,241,.48)', c: 'rgba(246,235,220,.56)',
    center: 'rgba(255,255,255,.2)', textGlow: 'rgba(255,255,255,.14)', track: 'rgba(255,255,255,.32)', line: 'rgba(255,191,107,.58)', dot: 'rgba(255,200,118,.98)'
  };
  const dusk = {
    bg1: 'dce5ef', bg2: 'dde3ea', bg3: 'efe4dc', ink: 'rgba(31,37,43,.84)', soft: 'rgba(31,37,43,.46)',
    a: 'rgba(255,245,234,.44)', b: 'rgba(205,219,240,.34)', c: 'rgba(245,214,188,.34)',
    center: 'rgba(255,242,228,.16)', textGlow: 'rgba(255,248,242,.08)', track: 'rgba(255,244,230,.24)', line: 'rgba(255,176,122,.46)', dot: 'rgba(255,190,132,.94)'
  };
  const night = {
    bg1: '171f29', bg2: '1e2836', bg3: '253140', ink: 'rgba(236,241,246,.9)', soft: 'rgba(236,241,246,.58)',
    a: 'rgba(215,225,255,.12)', b: 'rgba(170,191,236,.1)', c: 'rgba(255,240,214,.06)',
    center: 'rgba(210,222,255,.08)', textGlow: 'rgba(230,238,255,.04)', track: 'rgba(221,232,255,.16)', line: 'rgba(148,171,235,.22)', dot: 'rgba(223,233,255,.96)'
  };

  let p = day;
  if (mode === 'night') p = night;
  if (mode === 'dusk') {
    const blend = clamp(progress, 0, 1);
    p = {
      bg1: mixColor(day.bg1, dusk.bg1, blend),
      bg2: mixColor(day.bg2, dusk.bg2, blend),
      bg3: mixColor(day.bg3, dusk.bg3, blend),
      ink: dusk.ink,
      soft: dusk.soft,
      a: dusk.a,
      b: dusk.b,
      c: dusk.c,
      center: dusk.center,
      textGlow: dusk.textGlow,
      track: dusk.track,
      line: dusk.line,
      dot: dusk.dot
    };
  }

  root.style.setProperty('--bg1', `#${p.bg1}`);
  root.style.setProperty('--bg2', `#${p.bg2}`);
  root.style.setProperty('--bg3', `#${p.bg3}`);
  root.style.setProperty('--ink', p.ink);
  root.style.setProperty('--soft', p.soft);
  root.style.setProperty('--ambient-a', p.a);
  root.style.setProperty('--ambient-b', p.b);
  root.style.setProperty('--ambient-c', p.c);
  root.style.setProperty('--center-glow', p.center);
  root.style.setProperty('--text-glow', p.textGlow);
  root.style.setProperty('--solar-track', p.track);
  root.style.setProperty('--solar-line', p.line);
  root.style.setProperty('--solar-dot', p.dot);
}

function drawSunArc(progress, isNight, moonPhase = 0.5) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h - 4;
  const r = 24;

  const styles = getComputedStyle(root);
  const track = styles.getPropertyValue('--solar-track').trim() || 'rgba(255,255,255,0.28)';
  const line = styles.getPropertyValue('--solar-line').trim() || 'rgba(255,191,107,0.55)';
  const dot = styles.getPropertyValue('--solar-dot').trim() || 'rgba(255,198,112,0.96)';
  const moon = styles.getPropertyValue('--moon').trim() || 'rgba(223,233,255,.9)';

  ctx.lineWidth = 1.1;
  ctx.strokeStyle = track;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.stroke();

  if (!isNight) {
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * clamp(progress, 0, 1));
    ctx.stroke();

    const angle = Math.PI + Math.PI * progress;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    ctx.shadowBlur = 8;
    ctx.shadowColor = dot;
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = track;
    ctx.fillRect(4, h - 4.2, w - 8, 1);
  } else {
    const x = cx;
    const y = 9;
    const radius = 5.2;
    ctx.fillStyle = moon;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(223,233,255,.3)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const offset = (moonPhase - 0.5) * 9;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + offset, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    [[14,8],[18,13],[46,9],[52,15]].forEach(([sx, sy], i) => {
      const a = 0.4 + Math.sin(Date.now() / 1200 + i) * 0.18;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      ctx.fillRect(sx, sy, 1.1, 1.1);
    });
    ctx.globalAlpha = 1;
  }
}

function approxMoonPhase(date = new Date()) {
  const lp = 2551443;
  const newMoon = new Date('2025-12-20T01:43:00Z').getTime();
  const phase = (((date.getTime() / 1000 - newMoon / 1000) % lp) + lp) % lp;
  return phase / lp;
}

function fallbackSolar() {
  const now = new Date();
  const sunrise = new Date(now);
  const sunset = new Date(now);
  sunrise.setHours(6, 15, 0, 0);
  sunset.setHours(18, 5, 0, 0);
  return { sunrise, sunset, source: 'fallback' };
}

async function getSolarTimes() {
  try {
    const geo = await fetch('https://ipwho.is/').then(r => r.json());
    if (!geo.success) throw new Error('geo failed');
    const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${geo.latitude}&lng=${geo.longitude}&formatted=0`);
    const data = await res.json();
    if (!data.results) throw new Error('sun api failed');
    return {
      sunrise: new Date(data.results.sunrise),
      sunset: new Date(data.results.sunset),
      source: 'ip'
    };
  } catch (error) {
    return fallbackSolar();
  }
}

function renderSolar(sunrise, sunset) {
  const now = new Date();
  const t = now.getTime();
  const sr = sunrise.getTime();
  const ss = sunset.getTime();
  const isNight = t < sr || t > ss;

  if (!isNight) {
    const progress = (t - sr) / (ss - sr);
    drawSunArc(progress, false);
    solarLabel.textContent = 'sun';
    solarTimes.textContent = `${fmt(sunrise)} / ${fmt(sunset)}`;

    const duskEdge = Math.min(progress, 1 - progress);
    if (duskEdge < 0.18) {
      setPalette('dusk', 1 - duskEdge / 0.18);
    } else {
      setPalette('day', progress);
    }
  } else {
    drawSunArc(0, true, approxMoonPhase(now));
    solarLabel.textContent = 'moon';
    solarTimes.textContent = `${fmt(sunrise)} / ${fmt(sunset)}`;
    setPalette('night');
  }
}

async function init() {
  pickLine();
  updateClock();
  setInterval(updateClock, 1000);

  let solar = await getSolarTimes();
  renderSolar(solar.sunrise, solar.sunset);
  setInterval(() => renderSolar(solar.sunrise, solar.sunset), 60 * 1000);

  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 5, 0);
  setTimeout(async () => {
    pickLine(true);
    solar = await getSolarTimes();
    renderSolar(solar.sunrise, solar.sunset);
  }, nextMidnight.getTime() - Date.now());
}

init();
