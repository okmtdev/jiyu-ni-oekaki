import { navigate } from '../main';

export function showTitleScreen(container: HTMLElement) {
  const screen = document.createElement('div');
  screen.className = 'screen title-screen';

  // Floating decorations
  const decorations = document.createElement('div');
  decorations.className = 'title-decorations';
  const emojis = ['⭐', '🌈', '🎨', '✏️', '🖌️', '❤️', '🌸', '🦋', '☀️', '🎵', '🐱', '🐶'];
  for (let i = 0; i < 14; i++) {
    const span = document.createElement('span');
    span.className = 'title-deco-item';
    span.textContent = emojis[i % emojis.length];
    span.style.left = `${5 + Math.random() * 90}%`;
    span.style.top = `${5 + Math.random() * 90}%`;
    span.style.animationDelay = `${Math.random() * 5}s`;
    span.style.animationDuration = `${3 + Math.random() * 4}s`;
    span.style.fontSize = `${22 + Math.random() * 28}px`;
    decorations.appendChild(span);
  }
  screen.appendChild(decorations);

  // Main content
  const content = document.createElement('div');
  content.className = 'title-content';

  content.innerHTML = `
    <h1 class="title-text">
      <span class="title-line">じゆうに</span>
      <span class="title-line title-line--big">おえかき！</span>
    </h1>
    <div class="title-palette">
      <span class="title-palette-dot" style="background:#FF0000"></span>
      <span class="title-palette-dot" style="background:#FF8800"></span>
      <span class="title-palette-dot" style="background:#FFDD00"></span>
      <span class="title-palette-dot" style="background:#00BB00"></span>
      <span class="title-palette-dot" style="background:#0066FF"></span>
      <span class="title-palette-dot" style="background:#8800FF"></span>
      <span class="title-palette-dot" style="background:#FF44AA"></span>
    </div>
    <div class="title-buttons">
      <button class="btn btn--start">かいし</button>
      <button class="btn btn--gallery">びじゅつかん</button>
    </div>
  `;

  screen.appendChild(content);
  container.appendChild(screen);

  // Event listeners
  content.querySelector('.btn--start')!.addEventListener('click', () => {
    navigate('drawing');
  });

  content.querySelector('.btn--gallery')!.addEventListener('click', () => {
    navigate('gallery');
  });
}
