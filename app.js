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
    bg1: 'f5f3ef', bg2: 'ebe8e2', bg3: 'f9f6f0', ink: 'rgba(35,30,25,.88)', soft: 'rgba(35,30,25,.45)',
    a: 'rgba(255,255,255,.72)', b: 'rgba(235,225,210,.45)', c: 'rgba(255,248,235,.5)',
    center: 'rgba(255,252,245,.25)', textGlow: 'rgba(255,250,240,.18)', track: 'rgba(200,180,155,.25)', line: 'rgba(210,165,100,.55)', dot: 'rgba(225,180,110,.95)',
    glass: 'rgba(255,255,255,.35)', glassBorder: 'rgba(255,255,255,.5)'
  };
  const dusk = {
    bg1: 'e8e2da', bg2: 'e0d8cf', bg3: 'f0e6dc', ink: 'rgba(40,32,26,.86)', soft: 'rgba(40,32,26,.48)',
    a: 'rgba(255,245,230,.48)', b: 'rgba(225,210,190,.38)', c: 'rgba(255,235,210,.42)',
    center: 'rgba(255,245,230,.2)', textGlow: 'rgba(255,248,235,.12)', track: 'rgba(200,170,140,.28)', line: 'rgba(220,160,95,.52)', dot: 'rgba(235,175,105,.96)',
    glass: 'rgba(255,252,248,.4)', glassBorder: 'rgba(255,250,245,.55)'
  };
  const night = {
    bg1: '1a1f28', bg2: '1f2633', bg3: '242d3c', ink: 'rgba(240,245,250,.92)', soft: 'rgba(240,245,250,.55)',
    a: 'rgba(200,215,245,.1)', b: 'rgba(180,195,225,.08)', c: 'rgba(255,245,220,.05)',
    center: 'rgba(210,225,255,.06)', textGlow: 'rgba(235,245,255,.05)', track: 'rgba(200,215,240,.14)', line: 'rgba(140,165,220,.2)', dot: 'rgba(225,235,255,.94)',
    glass: 'rgba(255,255,255,.06)', glassBorder: 'rgba(255,255,255,.1)'
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
      dot: dusk.dot,
      glass: dusk.glass,
      glassBorder: dusk.glassBorder
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
  root.style.setProperty('--glass', p.glass);
  root.style.setProperty('--glass-border', p.glassBorder);
  
  // Update theme-color meta tag
  const themeColor = mode === 'night' ? '#1a1f28' : (mode === 'dusk' ? '#e8e2da' : '#f5f3ef');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
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
