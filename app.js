const factions = {
  Ancient: { asset: 'Ancienrt', icon: 'A', title: 'Древний щит', colors: ['#A72A28','#536A9C','#6F8061','#2D2C2A','#C4BF9F','#D3873C'] },
  Pagans: { asset: 'Pagan', icon: 'P', title: 'Языческий щит', colors: ['#A64632','#383199','#396246','#20201E','#D2D5D2','#E5B72E'] },
  Remnant: { asset: 'Remnant', icon: 'R', title: 'Щит Остатков', colors: ['#6F2327','#4077A9','#16856A','#171717','#DFECEF','#AA8139'] }
};
let maskNumbers = window.DV_MASKS ?? ['1', '2', '3', '4', '5', '6'];
const copy = {
  en: { editorTitle:'Shield editor', intro:'Choose a faction, pattern, and two decoration colours.', faction:'Faction', factionTip:'style base', decoration:'Decoration', firstColor:'First colour', secondColor:'Second colour', swapColours:'Swap colours', preview:'PREVIEW / 128 × 128', mask:'MASK', previousMask:'Previous mask', nextMask:'Next mask', customColour:'Custom colour', download:'Download PNG' },
  ru: { editorTitle:'Редактор щитка', intro:'Выберите фракцию, маску и два цвета декора.', faction:'Фракция', factionTip:'основа стиля', decoration:'Декор', firstColor:'Первый цвет', secondColor:'Второй цвет', swapColours:'Поменять цвета', preview:'ПРЕДПРОСМОТР / 128 × 128', mask:'МАСКА', previousMask:'Предыдущая маска', nextMask:'Следующая маска', customColour:'Свой цвет', download:'Скачать PNG' }
};
const state = { faction: 'Ancient', mask: maskNumbers[0], colorA: factions.Ancient.colors[0], colorB: factions.Ancient.colors[1], language: 'en' };
const el = id => document.getElementById(id);
const canvas = el('shieldCanvas');
const ctx = canvas.getContext('2d');
const imageCache = new Map();
let renderVersion = 0;
const t = key => copy[state.language][key];
const resolveColour = value => typeof value === 'number' ? factions[state.faction].colors[value] : value;
function localize() {
  document.documentElement.lang = state.language;
  document.title = state.language === 'en' ? 'Herald — Shield Editor' : 'Herald — Редактор щитка';
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-language]').forEach(node => node.classList.toggle('active', node.dataset.language === state.language));
}
async function refreshMaskList() {
  try {
    const response = await fetch('/api/dv-masks', { cache:'no-store' });
    if (!response.ok) return;
    const updated = await response.json();
    if (!Array.isArray(updated) || !updated.length || updated.join() === maskNumbers.join()) return;
    maskNumbers = updated;
    if (!maskNumbers.includes(state.mask)) state.mask = maskNumbers[0];
    render();
  } catch { /* Static file hosting is supported through the generated manifest fallback. */ }
}

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const image = new Image(); image.src = src;
  const promise = image.decode().then(() => image);
  imageCache.set(src, promise); return promise;
}
function hexToRgb(hex) { const value = hex.slice(1); return [parseInt(value.slice(0,2),16),parseInt(value.slice(2,4),16),parseInt(value.slice(4,6),16)]; }
function paintMask(mask, shieldMask, first, second) {
  const buffer = document.createElement('canvas'); buffer.width = buffer.height = 128;
  const bufferCtx = buffer.getContext('2d'); bufferCtx.drawImage(mask, 0, 0, 128, 128);
  const pixels = bufferCtx.getImageData(0, 0, 128, 128);
  const shieldBuffer = document.createElement('canvas'); shieldBuffer.width = shieldBuffer.height = 128;
  const shieldCtx = shieldBuffer.getContext('2d'); shieldCtx.drawImage(shieldMask, 0, 0, 128, 128);
  const shieldPixels = shieldCtx.getImageData(0, 0, 128, 128); const a = hexToRgb(first); const b = hexToRgb(second);
  for (let y=0; y<128; y++) for (let x=0; x<128; x++) {
    const i=(y*128+x)*4; const luminance=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/765;
    const shieldLuminance=(shieldPixels.data[i]+shieldPixels.data[i+1]+shieldPixels.data[i+2])/765;
    const t=1-luminance;
    pixels.data[i]=Math.round(a[0]+(b[0]-a[0])*t); pixels.data[i+1]=Math.round(a[1]+(b[1]-a[1])*t); pixels.data[i+2]=Math.round(a[2]+(b[2]-a[2])*t); pixels.data[i+3]=Math.round(shieldLuminance*255);
  }
  bufferCtx.putImageData(pixels,0,0); ctx.drawImage(buffer,0,0,256,256);
}
async function renderCanvas(faction) {
  const version = ++renderVersion;
  const mask = state.mask, colorA = state.colorA, colorB = state.colorB;
  const [bg, dv, lt, fr] = await Promise.all([
    loadImage(`masks/bg_${faction.asset}.png`), loadImage(`masks/dv_${mask}.png`),
    loadImage(`masks/lt_${faction.asset}.png`), loadImage(`masks/fr_${faction.asset}.png`)
  ]);
  if (version !== renderVersion) return;
  ctx.clearRect(0,0,256,256);
  paintMask(bg, bg, faction.colors[4], faction.colors[4]);
  paintMask(dv, bg, resolveColour(colorA), resolveColour(colorB));
  ctx.drawImage(lt,0,0,256,256); ctx.drawImage(fr,0,0,256,256);
}

function drawControls() {
  el('factionOptions').innerHTML = Object.entries(factions).map(([name, data]) => `<button class="faction ${state.faction === name ? 'active':''}" data-faction="${name}"><img src="source/${data.icon}.png" alt="">${name}</button>`).join('');
  el('maskOptions').innerHTML = `
    <button class="mask-option mask-nav" data-mask-step="-1" aria-label="${t('previousMask')}">←</button>
    <select class="mask-select" id="maskSelect" aria-label="Номер маски">
      ${maskNumbers.map(n => `<option value="${n}" ${state.mask === n ? 'selected':''}>${t('mask')} ${n.toString().padStart(2,'0')}</option>`).join('')}
    </select>
    <button class="mask-option mask-nav" data-mask-step="1" aria-label="${t('nextMask')}">→</button>`;
  const palette = factions[state.faction].colors;
  const makeSwatches = (selected, attribute) => `${palette.map(color => `<button class="swatch ${color.toLowerCase() === resolveColour(selected).toLowerCase() ? 'active':''}" style="--color:${color}" data-${attribute}="${color}" aria-label="${color}"></button>`).join('')}
    <label class="swatch custom-swatch ${typeof selected === 'string' ? 'active':''}" style="--color:${resolveColour(selected)}" title="${t('customColour')}">
      <input type="color" value="${resolveColour(selected)}" data-custom="${attribute}" aria-label="${t('customColour')}"><span>+</span>
    </label>`;
  el('colorOne').innerHTML = makeSwatches(state.colorA, 'first');
  el('colorTwo').innerHTML = makeSwatches(state.colorB, 'second');
}
function render() {
  const faction = factions[state.faction];
  el('bgLayer').style.setProperty('--mask', `url("masks/bg_${faction.asset}.png")`);
  el('bgLayer').style.backgroundColor = faction.colors[4];
  el('dvLayer').style.setProperty('--dv', `url("masks/dv_${state.mask}.png")`);
  el('dvLayer').style.setProperty('--color-a', resolveColour(state.colorA));
  el('dvLayer').style.setProperty('--color-b', resolveColour(state.colorB));
  el('ltLayer').src = `masks/lt_${faction.asset}.png`;
  el('frLayer').src = `masks/fr_${faction.asset}.png`;
  renderCanvas(faction);
  localize();
  drawControls();
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.faction) state.faction = button.dataset.faction;
  if (button.dataset.language) state.language = button.dataset.language;
  if (button.dataset.mask) state.mask = button.dataset.mask;
  if (button.dataset.maskStep) {
    const current = maskNumbers.indexOf(state.mask);
    state.mask = maskNumbers[(current + Number(button.dataset.maskStep) + maskNumbers.length) % maskNumbers.length];
  }
  if (button.dataset.first) state.colorA = button.dataset.first;
  if (button.dataset.second) state.colorB = button.dataset.second;
  if (button.id === 'downloadButton') {
    canvas.toBlob(blob => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'herald-shield.png'; link.click(); URL.revokeObjectURL(link.href); }, 'image/png');
  }
  if (button.id === 'swapButton') [state.colorA, state.colorB] = [state.colorB, state.colorA];
  render();
});
document.addEventListener('change', event => {
  if (event.target.id === 'maskSelect') { state.mask = event.target.value; render(); }
  if (event.target.dataset.custom === 'first') { state.colorA = event.target.value; render(); }
  if (event.target.dataset.custom === 'second') { state.colorB = event.target.value; render(); }
});
render();
refreshMaskList();
setInterval(refreshMaskList, 3000);
