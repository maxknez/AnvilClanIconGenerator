const factions = {
  Ancient: { asset: 'Ancienrt', icon: 'A', title: 'Древний щит', colors: ['#A72A28','#536A9C','#6F8061','#2D2C2A','#C4BF9F','#D3873C'] },
  Pagans: { asset: 'Pagan', icon: 'P', title: 'Языческий щит', colors: ['#A64632','#383199','#396246','#20201E','#D2D5D2','#E5B72E'] },
  Remnant: { asset: 'Remnant', icon: 'R', title: 'Щит Остатков', colors: ['#6F2327','#4077A9','#16856A','#171717','#DFECEF','#AA8139'] }
};
const maskConfig = window.MASK_CONFIG;
const siteConfig = window.SITE_CONFIG ?? { version: '0.0.0' };
const masks = maskConfig.masks;
const copy = {
  en: { editorTitle:'Shield editor', intro:'Choose a faction, pattern, and two decoration colours.', faction:'Faction', factionTip:'style base', decoration:'Decoration', firstColor:'First colour', secondColor:'Second colour', swapColours:'Swap colours', preview:'PREVIEW / 128 × 128', mask:'MASK', previousMask:'Previous mask', nextMask:'Next mask', customColour:'Custom colour', download:'Download PNG' },
  ru: { editorTitle:'Редактор щитка', intro:'Выберите фракцию, маску и два цвета декора.', faction:'Фракция', factionTip:'основа стиля', decoration:'Декор', firstColor:'Первый цвет', secondColor:'Второй цвет', swapColours:'Поменять цвета', preview:'ПРЕДПРОСМОТР / 128 × 128', mask:'МАСКА', previousMask:'Предыдущая маска', nextMask:'Следующая маска', customColour:'Свой цвет', download:'Скачать PNG' }
};
const state = { faction: 'Ancient', mask: 0, colorA: 0, colorB: 1, language: 'en', maskScale: 2, offsetX: 0, offsetY: 0, flipX: false, flipY: false };
const el = id => document.getElementById(id);
const canvas = el('shieldCanvas');
const ctx = canvas.getContext('2d');
const imageCache = new Map();
let renderVersion = 0;
const t = key => copy[state.language][key];
const resolveColour = value => typeof value === 'number' ? factions[state.faction].colors[value] : value;
const getMaskSize = () => maskConfig.sizeOptions.find(option => option.scale === state.maskScale).pixels;
function clampMaskPosition() {
  const maskSize = getMaskSize();
  const limit = Math.max(0, (maskSize - maskConfig.baseSize) / 2);
  state.offsetX = Math.max(-limit, Math.min(limit, state.offsetX));
  state.offsetY = Math.max(-limit, Math.min(limit, state.offsetY));
}
function localize() {
  document.documentElement.lang = state.language;
  document.title = state.language === 'en' ? 'Herald — Shield Editor' : 'Herald — Редактор щитка';
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-language]').forEach(node => node.classList.toggle('active', node.dataset.language === state.language));
  el('siteVersion').textContent = `VERSION ${siteConfig.version}`;
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
function paintDecoration(mask, shieldMask, first, second, size, offsetX, offsetY, flipX, flipY) {
  const layer = document.createElement('canvas'); layer.width = layer.height = 256;
  const layerCtx = layer.getContext('2d');
  const renderedSize = size * 2;
  const x = (256 - renderedSize) / 2 + offsetX * 2;
  const y = (256 - renderedSize) / 2 + offsetY * 2;
  layerCtx.save();
  layerCtx.translate(x + (flipX ? renderedSize : 0), y + (flipY ? renderedSize : 0));
  layerCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  layerCtx.drawImage(mask, 0, 0, renderedSize, renderedSize);
  layerCtx.restore();
  const pixels = layerCtx.getImageData(0, 0, 256, 256);
  const shield = document.createElement('canvas'); shield.width = shield.height = 256;
  const shieldCtx = shield.getContext('2d'); shieldCtx.drawImage(shieldMask, 0, 0, 256, 256);
  const shieldPixels = shieldCtx.getImageData(0, 0, 256, 256);
  const a = hexToRgb(first), b = hexToRgb(second);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const luminance = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 765;
    const alpha = pixels.data[i + 3] / 255;
    const shieldLuminance = (shieldPixels.data[i] + shieldPixels.data[i + 1] + shieldPixels.data[i + 2]) / 765;
    const ratio = 1 - luminance;
    pixels.data[i] = Math.round(a[0] + (b[0] - a[0]) * ratio);
    pixels.data[i + 1] = Math.round(a[1] + (b[1] - a[1]) * ratio);
    pixels.data[i + 2] = Math.round(a[2] + (b[2] - a[2]) * ratio);
    pixels.data[i + 3] = Math.round(alpha * shieldLuminance * 255);
  }
  layerCtx.putImageData(pixels, 0, 0); ctx.drawImage(layer, 0, 0);
}
async function renderCanvas(faction) {
  const version = ++renderVersion;
  const mask = masks[state.mask], colorA = state.colorA, colorB = state.colorB;
  const [bg, dv, lt, fr] = await Promise.all([
    loadImage(`masks/bg_${faction.asset}.png`), loadImage(`${maskConfig.path}/${mask.file}`),
    loadImage(`masks/lt_${faction.asset}.png`), loadImage(`masks/fr_${faction.asset}.png`)
  ]);
  if (version !== renderVersion) return;
  ctx.clearRect(0,0,256,256);
  paintMask(bg, bg, faction.colors[4], faction.colors[4]);
  paintDecoration(dv, bg, resolveColour(colorA), resolveColour(colorB), getMaskSize(), state.offsetX, state.offsetY, state.flipX, state.flipY);
  ctx.drawImage(lt,0,0,256,256); ctx.drawImage(fr,0,0,256,256);
}

function drawControls() {
  el('factionOptions').innerHTML = Object.entries(factions).map(([name, data]) => `<button class="faction ${state.faction === name ? 'active':''}" data-faction="${name}"><img src="source/${data.icon}.png" alt="">${name}</button>`).join('');
  el('maskOptions').innerHTML = `
    <button class="mask-option mask-nav" data-mask-step="-1" aria-label="${t('previousMask')}">←</button>
    <select class="mask-select" id="maskSelect" aria-label="Номер маски">
      ${masks.map((mask, index) => `<option value="${index}" ${state.mask === index ? 'selected':''}>${mask.name}</option>`).join('')}
    </select>
    <button class="mask-option mask-nav" data-mask-step="1" aria-label="${t('nextMask')}">→</button>`;
  const palette = factions[state.faction].colors;
  const makeSwatches = (selected, attribute) => `${palette.map((color, index) => `<button class="swatch ${index === selected ? 'active':''}" style="--color:${color}" data-${attribute}="${index}" aria-label="${color}"></button>`).join('')}
    <label class="swatch custom-swatch ${typeof selected === 'string' ? 'active':''}" style="--color:${resolveColour(selected)}" title="${t('customColour')}">
      <input type="color" value="${resolveColour(selected)}" data-custom="${attribute}" aria-label="${t('customColour')}"><span>+</span>
    </label>`;
  el('colorOne').innerHTML = makeSwatches(state.colorA, 'first');
  el('colorTwo').innerHTML = makeSwatches(state.colorB, 'second');
  el('sizeControls').innerHTML = maskConfig.sizeOptions.map(option => `<button class="size-button ${state.maskScale === option.scale ? 'active':''}" data-scale="${option.scale}">×${option.scale}</button>`).join('');
  document.querySelectorAll('[data-flip]').forEach(button => button.classList.toggle('active', button.dataset.flip === 'x' ? state.flipX : state.flipY));
}
function render() {
  const faction = factions[state.faction];
  el('bgLayer').style.setProperty('--mask', `url("masks/bg_${faction.asset}.png")`);
  el('bgLayer').style.backgroundColor = faction.colors[4];
  el('dvLayer').style.setProperty('--dv', `url("${maskConfig.path}/${masks[state.mask].file}")`);
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
  if (button.dataset.mask) state.mask = Number(button.dataset.mask);
  if (button.dataset.maskStep) {
    state.mask = (state.mask + Number(button.dataset.maskStep) + masks.length) % masks.length;
  }
  if (button.dataset.first) state.colorA = Number(button.dataset.first);
  if (button.dataset.second) state.colorB = Number(button.dataset.second);
  if (button.dataset.scale) state.maskScale = Number(button.dataset.scale);
  if (button.dataset.flip === 'x') state.flipX = !state.flipX;
  if (button.dataset.flip === 'y') state.flipY = !state.flipY;
  if (button.dataset.move) {
    const step = maskConfig.moveStep;
    if (button.dataset.move === 'up') state.offsetY -= step;
    if (button.dataset.move === 'down') state.offsetY += step;
    if (button.dataset.move === 'left') state.offsetX -= step;
    if (button.dataset.move === 'right') state.offsetX += step;
    if (button.dataset.move === 'reset') { state.offsetX = 0; state.offsetY = 0; }
  }
  clampMaskPosition();
  if (button.id === 'downloadButton') {
    const output = document.createElement('canvas'); output.width = output.height = 128;
    output.getContext('2d').drawImage(canvas, 0, 0, 128, 128);
    output.toBlob(blob => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'herald-shield-128.png'; link.click(); URL.revokeObjectURL(link.href); }, 'image/png');
  }
  if (button.id === 'swapButton') [state.colorA, state.colorB] = [state.colorB, state.colorA];
  render();
});
document.addEventListener('change', event => {
  if (event.target.id === 'maskSelect') { state.mask = Number(event.target.value); render(); }
  if (event.target.dataset.custom === 'first') { state.colorA = event.target.value; render(); }
  if (event.target.dataset.custom === 'second') { state.colorB = event.target.value; render(); }
});
render();
