const seeds = {
  AAPL: { base: 180, vol: 0.6 },
  MSFT: { base: 380, vol: 0.5 },
  GOOGL: { base: 140, vol: 0.7 },
  TSLA: { base: 250, vol: 1.2 }
};

let data = [];         // price series
let seriesLen = 60;    // default resolution
let currentSymbol = 'AAPL';

const chartEl = document.getElementById('chart');
const ctx = chartEl.getContext('2d');
const lastPriceEl = document.getElementById('lastPrice');
const changePctEl = document.getElementById('changePct');
const symbolSelect = document.getElementById('symbolSelect');

// Generate mock series using random walk
function genSeries(symbol, n = 60) {
  const { base, vol } = seeds[symbol];
  const arr = [];
  let p = base;
  for (let i = 0; i < n; i++) {
    const shock = (Math.random() - 0.5) * vol * 2; // +/- vol
    p = Math.max(1, p + shock);
    arr.push(Number(p.toFixed(2)));
  }
  return arr;
}

// Draw simple line chart on canvas
function drawChart(series) {
  ctx.clearRect(0, 0, chartEl.width, chartEl.height);
  const padding = 32;
  const w = chartEl.width - padding * 2;
  const h = chartEl.height - padding * 2;
  const min = Math.min(...series);
  const max = Math.max(...series);

  // axes
  ctx.strokeStyle = '#2a3343';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, chartEl.height - padding);
  ctx.lineTo(chartEl.width - padding, chartEl.height - padding);
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, chartEl.height - padding);
  ctx.stroke();

  // line
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  series.forEach((p, i) => {
    const x = padding + (i / (series.length - 1)) * w;
    const y = padding + (1 - (p - min) / (max - min)) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // last price
  const last = series[series.length - 1];
  const first = series[0];
  const pct = ((last - first) / first) * 100;
  lastPriceEl.textContent = `$${last.toFixed(2)}`;
  changePctEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  changePctEl.style.color = pct >= 0 ? '#22c55e' : '#ef4444';
}

// Refresh series
function refresh(symbol = currentSymbol, len = seriesLen) {
  data = genSeries(symbol, len);
  drawChart(data);
}

symbolSelect.addEventListener('change', (e) => {
  currentSymbol = e.target.value;
  document.getElementById('symbolInput').value = currentSymbol;
  refresh(currentSymbol, seriesLen);
});

// Toolbar resolution
document.querySelectorAll('.chart-toolbar button').forEach(btn => {
  btn.addEventListener('click', () => {
    seriesLen = Number(btn.dataset.res);
    refresh(currentSymbol, seriesLen);
  });
});

// Simulate live updates
setInterval(() => {
  if (!data.length) return;
  const last = data[data.length - 1];
  const { vol } = seeds[currentSymbol];
  const shock = (Math.random() - 0.5) * vol * 2;
  const next = Math.max(1, Number((last + shock).toFixed(2)));
  data.push(next);
  if (data.length > seriesLen) data.shift();
  drawChart(data);
}, 1500);

// Initial load
refresh(currentSymbol, seriesLen);

// Order form logic
const orderForm = document.getElementById('orderForm');
const orderType = document.getElementById('orderType');
const priceRow = document.getElementById('priceRow');
const triggerRow = document.getElementById('triggerRow');
const orderMsg = document.getElementById('orderMsg');

orderType.addEventListener('change', () => {
  const type = orderType.value;
  priceRow.style.display = type === 'MARKET' ? 'none' : 'grid';
  triggerRow.style.display = type === 'SL' ? 'grid' : 'none';
});

orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const side = orderForm.side.value;
  const type = orderType.value;
  const qty = Number(document.getElementById('qty').value);
  const price = Number(document.getElementById('price').value);
  const trigger = Number(document.getElementById('trigger').value);
  const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();

  // Basic validations
  if (!symbol) return showMsg('Enter a valid symbol.');
  if (!qty || qty < 1) return showMsg('Quantity must be at least 1.');
  if (type !== 'MARKET' && (!price || price <= 0)) return showMsg('Enter a valid price.');
  if (type === 'SL' && (!trigger || trigger <= 0)) return showMsg('Enter a valid trigger.');

  // Simulated order "placement"
  const lp = data[data.length - 1] || seeds[symbol]?.base || 100;
  const summary = [
    `Order: ${side} ${symbol}`,
    `Type: ${type}`,
    `Qty: ${qty}`,
    `Price: ${type === 'MARKET' ? `Market (~$${lp.toFixed(2)})` : `$${price.toFixed(2)}`}`,
    ...(type === 'SL' ? [`Trigger: $${trigger.toFixed(2)}`] : [])
  ].join(' | ');

  showMsg(`Submitted ✅ ${summary}`);
  orderForm.reset();
  document.getElementById('symbolInput').value = currentSymbol;
  orderType.dispatchEvent(new Event('change')); // reset conditional fields
});

function showMsg(text) {
  orderMsg.textContent = text;
}

// P&L calculator
document.getElementById('calcBtn').addEventListener('click', () => {
  const entry = Number(document.getElementById('calcEntry').value);
  const exit = Number(document.getElementById('calcExit').value);
  const qty = Number(document.getElementById('calcQty').value);

  if (!entry || !exit || !qty) return setCalc('Enter entry, exit, and qty.');
  const pnl = (exit - entry) * qty;
  const pct = ((exit - entry) / entry) * 100;
  setCalc(`P&L: $${pnl.toFixed(2)} (${pct.toFixed(2)}%)`);
});

function setCalc(text) {
  document.getElementById('calcResult').textContent = text;
}

// Watchlist with localStorage
const watchForm = document.getElementById('watchForm');
const watchListEl = document.getElementById('watchList');

function getWatch() {
  try { return JSON.parse(localStorage.getItem('watchlist')) || []; } catch { return []; }
}
function setWatch(list) {
  localStorage.setItem('watchlist', JSON.stringify(list));
}
function renderWatch() {
  const list = getWatch();
  watchListEl.innerHTML = '';
  list.forEach(sym => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="symbol">${sym}</span>
      <span class="wprice">$${(seeds[sym]?.base || 100).toFixed(2)}</span>
      <span class="actions">
        <button class="icon-btn" data-go="${sym}">Chart</button>
        <button class="icon-btn" data-del="${sym}">Remove</button>
      </span>
    `;
    watchListEl.appendChild(li);
  });
}
renderWatch();

watchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const sym = document.getElementById('watchSymbol').value.trim().toUpperCase();
  if (!sym) return;
  const list = getWatch();
  if (!list.includes(sym)) {
    list.push(sym);
    setWatch(list);
    renderWatch();
  }
  document.getElementById('watchSymbol').value = '';
});

watchListEl.addEventListener('click', (e) => {
  if (e.target.dataset.del) {
    const sym = e.target.dataset.del;
    const list = getWatch().filter(s => s !== sym);
    setWatch(list);
    renderWatch();
  }
  if (e.target.dataset.go) {
    const sym = e.target.dataset.go;
    currentSymbol = sym;
    if (!seeds[sym]) {
      seeds[sym] = { base: 100, vol: 0.8 }; // default seed for unknown symbols
    }
    symbolSelect.value = sym;
    document.getElementById('symbolInput').value = sym;
    refresh(sym, seriesLen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
