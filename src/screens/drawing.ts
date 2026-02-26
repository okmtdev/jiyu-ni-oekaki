import { navigate } from '../main';
import { DrawingEngine, type ToolType } from '../drawing/engine';
import { saveDrawing } from '../api';
import { addDrawingId } from '../storage';

const COLORS = [
  '#FF0000', '#FF8800', '#FFDD00', '#88DD00', '#00BB00', '#00BBDD',
  '#0066FF', '#8800FF', '#FF44AA', '#884400', '#000000', '#FFFFFF',
];

const TOOLS: { type: ToolType; label: string; icon: string }[] = [
  { type: 'pen', label: 'ふで', icon: '✏️' },
  { type: 'marker', label: 'マーカー', icon: '🖊️' },
  { type: 'brush', label: 'ぶらし', icon: '🖌️' },
  { type: 'eraser', label: 'けしごむ', icon: '🧹' },
  { type: 'fill', label: 'ぬりつぶし', icon: '🪣' },
  { type: 'stamp', label: 'スタンプ', icon: '⭐' },
];

const STAMPS = ['⭐', '❤️', '🌸', '🐱', '🐶', '🐻', '☀️', '🌙', '🎵', '🌈', '👑', '🦋'];

const SIZES = [
  { value: 3, className: 'size-s' },
  { value: 8, className: 'size-m' },
  { value: 20, className: 'size-l' },
];

export function showDrawingScreen(container: HTMLElement) {
  const screen = document.createElement('div');
  screen.className = 'screen drawing-screen';

  // === Top bar ===
  const topbar = document.createElement('div');
  topbar.className = 'drawing-topbar';
  topbar.innerHTML = `
    <div class="topbar-left">
      <button class="topbar-btn topbar-btn--undo" title="もどす">↩</button>
      <button class="topbar-btn topbar-btn--clear" title="ぜんぶけす">🗑️</button>
    </div>
    <button class="topbar-btn topbar-btn--finish">おしまい</button>
  `;
  screen.appendChild(topbar);

  // === Canvas container ===
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'canvas-container';
  screen.appendChild(canvasContainer);

  // === Bottom toolbar ===
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  // Color row
  const colorRow = document.createElement('div');
  colorRow.className = 'toolbar-row toolbar-row--colors';
  COLORS.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.className = 'color-swatch';
    if (color === '#000000') swatch.classList.add('active');
    swatch.style.backgroundColor = color;
    if (color === '#FFFFFF') swatch.classList.add('color-swatch--white');
    colorRow.appendChild(swatch);
  });
  toolbar.appendChild(colorRow);

  // Stamp row (hidden by default)
  const stampRow = document.createElement('div');
  stampRow.className = 'toolbar-row toolbar-row--stamps hidden';
  STAMPS.forEach((emoji) => {
    const btn = document.createElement('button');
    btn.className = 'stamp-btn';
    if (emoji === '⭐') btn.classList.add('active');
    btn.textContent = emoji;
    stampRow.appendChild(btn);
  });
  toolbar.appendChild(stampRow);

  // Tools + sizes row
  const toolsRow = document.createElement('div');
  toolsRow.className = 'toolbar-row toolbar-row--tools';

  const toolGroup = document.createElement('div');
  toolGroup.className = 'tool-group';
  TOOLS.forEach((tool) => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.dataset.tool = tool.type;
    if (tool.type === 'pen') btn.classList.add('active');
    btn.innerHTML = `<span class="tool-icon">${tool.icon}</span><span class="tool-label">${tool.label}</span>`;
    toolGroup.appendChild(btn);
  });
  toolsRow.appendChild(toolGroup);

  const sizeGroup = document.createElement('div');
  sizeGroup.className = 'size-group';
  SIZES.forEach((size) => {
    const btn = document.createElement('button');
    btn.className = `size-btn ${size.className}`;
    if (size.value === 8) btn.classList.add('active');
    btn.innerHTML = '<span class="size-dot"></span>';
    btn.dataset.size = String(size.value);
    sizeGroup.appendChild(btn);
  });
  toolsRow.appendChild(sizeGroup);

  toolbar.appendChild(toolsRow);
  screen.appendChild(toolbar);

  container.appendChild(screen);

  // === Initialize engine ===
  const engine = new DrawingEngine(canvasContainer);

  // === Event handlers ===

  // Undo
  topbar.querySelector('.topbar-btn--undo')!.addEventListener('click', () => {
    engine.undo();
  });

  // Clear (with confirmation)
  topbar.querySelector('.topbar-btn--clear')!.addEventListener('click', () => {
    showClearConfirmDialog(screen, engine);
  });

  // Finish
  topbar.querySelector('.topbar-btn--finish')!.addEventListener('click', () => {
    showFinishDialog(screen, engine);
  });

  // Colors
  colorRow.addEventListener('click', (e) => {
    const swatch = (e.target as HTMLElement).closest('.color-swatch') as HTMLElement;
    if (!swatch) return;
    colorRow.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
    swatch.classList.add('active');
    engine.color = swatch.style.backgroundColor;
    // Convert rgb() to hex for the engine
    const rgb = swatch.style.backgroundColor;
    const match = rgb.match(/\d+/g);
    if (match) {
      const hex = '#' + match.map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
      engine.color = hex;
    }
  });

  // Stamps
  stampRow.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.stamp-btn') as HTMLElement;
    if (!btn) return;
    stampRow.querySelectorAll('.stamp-btn').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    engine.stampEmoji = btn.textContent || '⭐';
  });

  // Tools
  toolGroup.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.tool-btn') as HTMLElement;
    if (!btn) return;
    toolGroup.querySelectorAll('.tool-btn').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    engine.tool = btn.dataset.tool as ToolType;

    // Show stamp row or color row
    if (engine.tool === 'stamp') {
      colorRow.classList.add('hidden');
      stampRow.classList.remove('hidden');
    } else {
      colorRow.classList.remove('hidden');
      stampRow.classList.add('hidden');
    }
  });

  // Sizes
  sizeGroup.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.size-btn') as HTMLElement;
    if (!btn) return;
    sizeGroup.querySelectorAll('.size-btn').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    engine.size = parseInt(btn.dataset.size || '8');
  });

  // Resize handler
  const onResize = () => engine.resize();
  window.addEventListener('resize', onResize);
}

function showClearConfirmDialog(screen: HTMLElement, engine: DrawingEngine) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  overlay.innerHTML = `
    <div class="dialog">
      <p class="dialog-text">ぜんぶ けす？</p>
      <div class="dialog-buttons">
        <button class="btn btn--clear-yes">けす</button>
        <button class="btn btn--back">やめる</button>
      </div>
    </div>
  `;

  overlay.querySelector('.btn--clear-yes')!.addEventListener('click', () => {
    engine.clear();
    overlay.remove();
  });

  overlay.querySelector('.btn--back')!.addEventListener('click', () => {
    overlay.remove();
  });

  screen.appendChild(overlay);
}

function showFinishDialog(screen: HTMLElement, engine: DrawingEngine) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  overlay.innerHTML = `
    <div class="dialog">
      <p class="dialog-text">おしまいにする？</p>
      <div class="dialog-buttons">
        <button class="btn btn--save">ほぞん</button>
        <button class="btn btn--quit">おわる</button>
        <button class="btn btn--back">もどる</button>
      </div>
    </div>
  `;

  overlay.querySelector('.btn--save')!.addEventListener('click', async () => {
    const saveBtn = overlay.querySelector('.btn--save') as HTMLButtonElement;
    saveBtn.textContent = 'ほぞんちゅう...';
    saveBtn.disabled = true;

    try {
      const imageData = engine.toDataURL();
      const drawing = await saveDrawing(imageData);
      addDrawingId(drawing.id);
      engine.destroy();
      navigate('title');
    } catch {
      saveBtn.textContent = 'もういちど';
      saveBtn.disabled = false;
    }
  });

  overlay.querySelector('.btn--quit')!.addEventListener('click', () => {
    engine.destroy();
    navigate('title');
  });

  overlay.querySelector('.btn--back')!.addEventListener('click', () => {
    overlay.remove();
  });

  screen.appendChild(overlay);
}
