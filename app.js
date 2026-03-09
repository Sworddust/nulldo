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

// 多时段调色板：黎明 -> 日出 -> 上午 -> 正午 -> 下午 -> 日落 -> 黄昏 -> 夜晚
const palettes = {
  dawn: {      // 黎明 - 柔和的粉紫色
    bg1: 'e8dfe8', bg2: 'ddd5e0', bg3: 'f0e8ed', ink: 'rgba(45,35,50,.85)', soft: 'rgba(45,35,50,.45)',
    a: 'rgba(255,235,245,.55)', b: 'rgba(220,200,225,.4)', c: 'rgba(255,230,235,.45)',
    center: 'rgba(255,240,250,.2)', textGlow: 'rgba(255,235,245,.15)', track: 'rgba(200,170,190,.25)', line: 'rgba(220,150,170,.5)', dot: 'rgba(245,180,190,.95)',
    glass: 'rgba(255,250,255,.38)', glassBorder: 'rgba(255,245,250,.5)'
  },
  sunrise: {   // 日出 - 温暖的橙粉色
    bg1: 'f5ebe5', bg2: 'efe3da', bg3: 'faf2ea', ink: 'rgba(50,35,25,.88)', soft: 'rgba(50,35,25,.45)',
    a: 'rgba(255,245,235,.6)', b: 'rgba(255,220,200,.45)', c: 'rgba(255,235,215,.5)',
    center: 'rgba(255,245,230,.25)', textGlow: 'rgba(255,240,220,.18)', track: 'rgba(220,170,140,.28)', line: 'rgba(240,150,90,.58)', dot: 'rgba(255,170,100,.98)',
    glass: 'rgba(255,252,248,.4)', glassBorder: 'rgba(255,248,240,.55)'
  },
  morning: {   // 上午 - 清新明亮
    bg1: 'f5f5f0', bg2: 'eef0e8', bg3: 'fafaf5', ink: 'rgba(35,38,32,.88)', soft: 'rgba(35,38,32,.45)',
    a: 'rgba(255,255,250,.7)', b: 'rgba(235,245,230,.45)', c: 'rgba(250,255,245,.5)',
    center: 'rgba(255,255,250,.25)', textGlow: 'rgba(255,255,248,.18)', track: 'rgba(180,195,165,.25)', line: 'rgba(190,180,120,.55)', dot: 'rgba(220,200,130,.95)',
    glass: 'rgba(255,255,255,.38)', glassBorder: 'rgba(255,255,255,.52)'
  },
  noon: {      // 正午 - 明亮温暖
    bg1: 'f8f6f2', bg2: 'f2efe8', bg3: 'fdfbf6', ink: 'rgba(40,35,28,.88)', soft: 'rgba(40,35,28,.45)',
    a: 'rgba(255,255,255,.72)', b: 'rgba(250,245,235,.48)', c: 'rgba(255,252,245,.52)',
    center: 'rgba(255,255,250,.28)', textGlow: 'rgba(255,252,245,.2)', track: 'rgba(200,185,160,.25)', line: 'rgba(220,185,120,.55)', dot: 'rgba(240,200,130,.96)',
    glass: 'rgba(255,255,255,.4)', glassBorder: 'rgba(255,255,255,.55)'
  },
  afternoon: { // 下午 - 柔和金色
    bg1: 'f5f0e8', bg2: 'efe8de', bg3: 'faf5ec', ink: 'rgba(45,38,28,.88)', soft: 'rgba(45,38,28,.45)',
    a: 'rgba(255,250,240,.65)', b: 'rgba(245,235,215,.45)', c: 'rgba(255,248,230,.5)',
    center: 'rgba(255,250,235,.25)', textGlow: 'rgba(255,248,230,.18)', track: 'rgba(200,175,145,.26)', line: 'rgba(215,170,105,.55)', dot: 'rgba(235,185,115,.96)',
    glass: 'rgba(255,252,245,.38)', glassBorder: 'rgba(255,250,242,.52)'
  },
  sunset: {    // 日落 - 温暖橙红
    bg1: 'f0e5dc', bg2: 'e8dcd0', bg3: 'f5ebe0', ink: 'rgba(55,35,25,.88)', soft: 'rgba(55,35,25,.48)',
    a: 'rgba(255,240,225,.55)', b: 'rgba(250,215,185,.42)', c: 'rgba(255,230,200,.48)',
    center: 'rgba(255,235,210,.22)', textGlow: 'rgba(255,235,210,.15)', track: 'rgba(210,165,130,.28)', line: 'rgba(235,145,85,.55)', dot: 'rgba(255,160,95,.98)',
    glass: 'rgba(255,248,240,.42)', glassBorder: 'rgba(255,245,235,.55)'
  },
  dusk: {      // 黄昏 - 深紫橙混合
    bg1: 'ddd5dc', bg2: 'd5ccd5', bg3: 'e5dde2', ink: 'rgba(50,38,45,.86)', soft: 'rgba(50,38,45,.48)',
    a: 'rgba(245,230,240,.45)', b: 'rgba(225,210,220,.38)', c: 'rgba(255,235,230,.4)',
    center: 'rgba(245,230,240,.18)', textGlow: 'rgba(245,235,240,.12)', track: 'rgba(180,160,175,.25)', line: 'rgba(200,140,160,.45)', dot: 'rgba(230,170,180,.94)',
    glass: 'rgba(250,245,250,.35)', glassBorder: 'rgba(245,240,248,.48)'
  },
  night: {     // 夜晚 - 深蓝色
    bg1: '1a1f28', bg2: '1f2633', bg3: '242d3c', ink: 'rgba(240,245,250,.92)', soft: 'rgba(240,245,250,.55)',
    a: 'rgba(200,215,245,.1)', b: 'rgba(180,195,225,.08)', c: 'rgba(255,245,220,.05)',
    center: 'rgba(210,225,255,.06)', textGlow: 'rgba(235,245,255,.05)', track: 'rgba(200,215,240,.14)', line: 'rgba(140,165,220,.2)', dot: 'rgba(225,235,255,.94)',
    glass: 'rgba(255,255,255,.06)', glassBorder: 'rgba(255,255,255,.1)'
  }
};

// 根据太阳进度获取混合的调色板
function getBlendedPalette(progress, isNight) {
  if (isNight) return palettes.night;
  
  // 定义时段节点: [进度, 调色板名称]
  const stops = [
    [0.00, 'dawn'],      // 0% - 日出时刻
    [0.08, 'sunrise'],   // 8% - 日出后
    [0.20, 'morning'],   // 20% - 上午
    [0.45, 'noon'],      // 45% - 正午前后
    [0.65, 'afternoon'], // 65% - 下午
    [0.85, 'sunset'],    // 85% - 日落前
    [0.95, 'dusk'],      // 95% - 黄昏
    [1.00, 'dusk']       // 100% - 日落时刻
  ];
  
  // 找到当前进度所在的区间
  let fromStop = stops[0];
  let toStop = stops[1];
  
  for (let i = 0; i < stops.length - 1; i++) {
    if (progress >= stops[i][0] && progress <= stops[i + 1][0]) {
      fromStop = stops[i];
      toStop = stops[i + 1];
      break;
    }
  }
  
  // 计算区间内的插值比例
  const range = toStop[0] - fromStop[0];
  const t = range > 0 ? (progress - fromStop[0]) / range : 0;
  const smoothT = t * t * (3 - 2 * t); // smoothstep 平滑过渡
  
  const from = palettes[fromStop[1]];
  const to = palettes[toStop[1]];
  
  // 混合两个调色板
  return {
    bg1: mixColor(from.bg1, to.bg1, smoothT),
    bg2: mixColor(from.bg2, to.bg2, smoothT),
    bg3: mixColor(from.bg3, to.bg3, smoothT),
    ink: lerpRgba(from.ink, to.ink, smoothT),
    soft: lerpRgba(from.soft, to.soft, smoothT),
    a: lerpRgba(from.a, to.a, smoothT),
    b: lerpRgba(from.b, to.b, smoothT),
    c: lerpRgba(from.c, to.c, smoothT),
    center: lerpRgba(from.center, to.center, smoothT),
    textGlow: lerpRgba(from.textGlow, to.textGlow, smoothT),
    track: lerpRgba(from.track, to.track, smoothT),
    line: lerpRgba(from.line, to.line, smoothT),
    dot: lerpRgba(from.dot, to.dot, smoothT),
    glass: lerpRgba(from.glass, to.glass, smoothT),
    glassBorder: lerpRgba(from.glassBorder, to.glassBorder, smoothT)
  };
}

// 解析和混合 rgba 颜色
function lerpRgba(c1, c2, t) {
  const parse = (c) => {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (!m) return [0, 0, 0, 1];
    return [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1];
  };
  const a = parse(c1);
  const b = parse(c2);
  return `rgba(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))},${lerp(a[3], b[3], t).toFixed(2)})`;
}

function setPalette(mode, progress = 0.5) {
  const isNight = mode === 'night';
  const p = getBlendedPalette(progress, isNight);

  root.style.setProperty('--bg1', p.bg1.startsWith('#') ? p.bg1 : `#${p.bg1}`);
  root.style.setProperty('--bg2', p.bg2.startsWith('#') ? p.bg2 : `#${p.bg2}`);
  root.style.setProperty('--bg3', p.bg3.startsWith('#') ? p.bg3 : `#${p.bg3}`);
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
  const bg1 = p.bg1.startsWith('#') ? p.bg1 : `#${p.bg1}`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg1);
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
    // 根据太阳进度动态更新背景颜色
    setPalette('day', progress);
  } else {
    drawSunArc(0, true, approxMoonPhase(now));
    solarLabel.textContent = 'moon';
    solarTimes.textContent = `${fmt(sunrise)} / ${fmt(sunset)}`;
    setPalette('night', 0);
  }
}

async function init() {
  pickLine();
  updateClock();
  setInterval(updateClock, 1000);

  // 立即用默认值渲染，不阻塞
  let solar = fallbackSolar();
  renderSolar(solar.sunrise, solar.sunset);
  
  // 异步获取真实数据后更新
  getSolarTimes().then(realSolar => {
    if (realSolar.source !== 'fallback') {
      solar = realSolar;
      renderSolar(solar.sunrise, solar.sunset);
    }
  });
  
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
