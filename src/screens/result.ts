import { navigate } from '../main';
import { isCloudMode } from '../api';

export function showResultScreen(container: HTMLElement, imageUrl: string, drawingId: string) {
  const screen = document.createElement('div');
  screen.className = 'screen result-screen';

  // Confetti container
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  screen.appendChild(confettiContainer);

  // Content
  const content = document.createElement('div');
  content.className = 'result-content';

  const cloudMode = isCloudMode();
  const shareUrl = cloudMode ? imageUrl : '';

  content.innerHTML = `
    <h1 class="result-title">よくできたね！</h1>
    <div class="result-image-wrap">
      <img class="result-image" src="${imageUrl}" alt="おえかき" />
    </div>
    <div class="result-actions">
      ${cloudMode ? `<button class="btn btn--line">LINE でシェア</button>` : ''}
      <button class="btn btn--download">ダウンロード</button>
      <button class="btn btn--home">タイトルにもどる</button>
    </div>
  `;

  screen.appendChild(content);
  container.appendChild(screen);

  // Create confetti
  createConfetti(confettiContainer);

  // Events
  if (cloudMode) {
    content.querySelector('.btn--line')!.addEventListener('click', () => {
      const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
      window.open(lineUrl, '_blank');
    });
  }

  content.querySelector('.btn--download')!.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `oekaki-${drawingId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  content.querySelector('.btn--home')!.addEventListener('click', () => {
    navigate('title');
  });
}

function createConfetti(container: HTMLElement) {
  const colors = ['#FF0000', '#FF8800', '#FFDD00', '#00BB00', '#0066FF', '#8800FF', '#FF44AA'];
  const shapes = ['confetti--circle', 'confetti--rect', 'confetti--star'];

  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    el.className = `confetti ${shape}`;
    el.style.left = `${Math.random() * 100}%`;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay = `${Math.random() * 1.5}s`;
    el.style.animationDuration = `${2 + Math.random() * 3}s`;

    if (shape === 'confetti--star') {
      el.textContent = '⭐';
      el.style.backgroundColor = 'transparent';
    }

    container.appendChild(el);
  }
}
