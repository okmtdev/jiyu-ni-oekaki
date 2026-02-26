const API_URL = import.meta.env.VITE_API_URL || '';

export interface Drawing {
  id: string;
  url: string;
  createdAt: string;
}

export function isCloudMode(): boolean {
  return !!API_URL;
}

export async function saveDrawing(imageDataUrl: string): Promise<Drawing> {
  if (!API_URL) {
    // Local mode: save to localStorage
    const id = crypto.randomUUID();
    const drawing: Drawing = {
      id,
      url: imageDataUrl,
      createdAt: new Date().toISOString(),
    };
    const store = getLocalStore();
    store[id] = drawing;
    localStorage.setItem('oekaki_local_data', JSON.stringify(store));
    return drawing;
  }

  const res = await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!res.ok) throw new Error('Save failed');
  return res.json();
}

export async function getDrawings(ids: string[]): Promise<Drawing[]> {
  if (ids.length === 0) return [];

  if (!API_URL) {
    const store = getLocalStore();
    return ids.map((id) => store[id]).filter(Boolean);
  }

  const res = await fetch(`${API_URL}/drawings?ids=${ids.join(',')}`);
  if (!res.ok) throw new Error('Fetch failed');
  const data = await res.json();
  return data.drawings;
}

export async function getGallery(): Promise<Drawing[]> {
  if (!API_URL) {
    const store = getLocalStore();
    return Object.values(store).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const res = await fetch(`${API_URL}/gallery`);
  if (!res.ok) throw new Error('Fetch failed');
  const data = await res.json();
  return data.drawings;
}

function getLocalStore(): Record<string, Drawing> {
  try {
    return JSON.parse(localStorage.getItem('oekaki_local_data') || '{}');
  } catch {
    return {};
  }
}
