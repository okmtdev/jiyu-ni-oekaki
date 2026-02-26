import { navigate } from '../main';
import { getDrawings, getGallery, deleteDrawing, isCloudMode, type Drawing } from '../api';
import { getMyDrawingIds, removeDrawingId } from '../storage';

export function showGalleryScreen(container: HTMLElement) {
  const screen = document.createElement('div');
  screen.className = 'screen gallery-screen';

  screen.innerHTML = `
    <div class="gallery-topbar">
      <button class="topbar-btn topbar-btn--back">もどる</button>
      <h2 class="gallery-title">びじゅつかん</h2>
      <div class="topbar-spacer"></div>
    </div>
    <div class="gallery-tabs">
      <button class="gallery-tab active" data-tab="mine">じぶんのえ</button>
      <button class="gallery-tab" data-tab="everyone">みんなのえ</button>
    </div>
    <div class="gallery-content">
      <div class="gallery-loading">よみこみちゅう...</div>
    </div>
  `;

  container.appendChild(screen);

  let currentTab = 'mine';

  // Tab switching
  screen.querySelectorAll('.gallery-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const t = tab as HTMLElement;
      screen.querySelectorAll('.gallery-tab').forEach((t2) => t2.classList.remove('active'));
      t.classList.add('active');
      currentTab = t.dataset.tab || 'mine';
      loadGallery();
    });
  });

  // Back button
  screen.querySelector('.topbar-btn--back')!.addEventListener('click', () => {
    navigate('title');
  });

  async function loadGallery() {
    const content = screen.querySelector('.gallery-content')!;
    content.innerHTML = '<div class="gallery-loading">よみこみちゅう...</div>';

    try {
      let drawings: Drawing[];

      if (currentTab === 'mine') {
        const ids = getMyDrawingIds();
        if (ids.length === 0) {
          content.innerHTML = `
            <div class="gallery-empty">
              <span class="gallery-empty-icon">🎨</span>
              <p>まだ えが ないよ！</p>
              <p>おえかき しよう！</p>
            </div>
          `;
          return;
        }
        drawings = await getDrawings(ids);
      } else {
        drawings = await getGallery();
        if (drawings.length === 0) {
          content.innerHTML = `
            <div class="gallery-empty">
              <span class="gallery-empty-icon">🖼️</span>
              <p>まだ えが ないよ！</p>
            </div>
          `;
          return;
        }
      }

      renderGrid(content, drawings, currentTab === 'mine');
    } catch {
      content.innerHTML = `
        <div class="gallery-empty">
          <span class="gallery-empty-icon">😢</span>
          <p>よみこめなかったよ...</p>
        </div>
      `;
    }
  }

  function renderGrid(contentEl: Element, drawings: Drawing[], isMine: boolean) {
    contentEl.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';

    drawings.forEach((drawing) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      const img = document.createElement('img');
      img.src = drawing.url;
      img.loading = 'lazy';
      img.alt = 'おえかき';
      card.appendChild(img);
      card.addEventListener('click', () => showDetail(drawing, isMine));
      grid.appendChild(card);
    });

    contentEl.appendChild(grid);
  }

  function showDetail(drawing: Drawing, isMine: boolean) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const cloudMode = isCloudMode();

    overlay.innerHTML = `
      <div class="detail-view">
        <img class="detail-image" src="${drawing.url}" alt="おえかき" />
        <div class="detail-actions">
          ${isMine && cloudMode ? `<button class="btn btn--line">LINE でシェア</button>` : ''}
          <button class="btn btn--download">ダウンロード</button>
          ${isMine ? `<button class="btn btn--delete">さくじょ</button>` : ''}
          <button class="btn btn--close">とじる</button>
        </div>
      </div>
    `;

    if (isMine && cloudMode) {
      overlay.querySelector('.btn--line')!.addEventListener('click', () => {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(drawing.url)}`;
        window.open(lineUrl, '_blank');
      });
    }

    const deleteBtn = overlay.querySelector('.btn--delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        showDeleteConfirmDialog(overlay, drawing, () => {
          overlay.remove();
          loadGallery();
        });
      });
    }

    overlay.querySelector('.btn--download')!.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = drawing.url;
      a.download = `oekaki-${drawing.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    overlay.querySelector('.btn--close')!.addEventListener('click', () => {
      overlay.remove();
    });

    // Close on overlay background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    screen.appendChild(overlay);
  }

  function showDeleteConfirmDialog(parentOverlay: HTMLElement, drawing: Drawing, onDeleted: () => void) {
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'overlay';
    confirmOverlay.style.zIndex = '200';

    confirmOverlay.innerHTML = `
      <div class="dialog">
        <p class="dialog-text">このえを けす？</p>
        <div class="dialog-buttons">
          <button class="btn btn--delete">けす</button>
          <button class="btn btn--back">やめる</button>
        </div>
      </div>
    `;

    confirmOverlay.querySelector('.btn--delete')!.addEventListener('click', async () => {
      const delBtn = confirmOverlay.querySelector('.btn--delete') as HTMLButtonElement;
      delBtn.textContent = 'さくじょちゅう...';
      delBtn.disabled = true;

      try {
        await deleteDrawing(drawing.id);
        removeDrawingId(drawing.id);
        confirmOverlay.remove();
        onDeleted();
      } catch {
        delBtn.textContent = 'もういちど';
        delBtn.disabled = false;
      }
    });

    confirmOverlay.querySelector('.btn--back')!.addEventListener('click', () => {
      confirmOverlay.remove();
    });

    parentOverlay.appendChild(confirmOverlay);
  }

  // Initial load
  loadGallery();
}
