import './style.css';
import { showTitleScreen } from './screens/title';
import { showDrawingScreen } from './screens/drawing';
import { showResultScreen } from './screens/result';
import { showGalleryScreen } from './screens/gallery';

type Screen = 'title' | 'drawing' | 'result' | 'gallery';

export interface NavigateOptions {
  imageData?: string;
  drawingId?: string;
}

const app = document.getElementById('app')!;

export function navigate(screen: Screen, options?: NavigateOptions) {
  app.innerHTML = '';

  switch (screen) {
    case 'title':
      showTitleScreen(app);
      break;
    case 'drawing':
      showDrawingScreen(app);
      break;
    case 'result':
      showResultScreen(app, options?.imageData || '', options?.drawingId || '');
      break;
    case 'gallery':
      showGalleryScreen(app);
      break;
  }
}

// Start
navigate('title');
