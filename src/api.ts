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
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Always save to localStorage first
  const localDrawing: Drawing = { id, url: imageDataUrl, createdAt: now };
  const store = getLocalStore();
  store[id] = localDrawing;
  localStorage.setItem('oekaki_local_data', JSON.stringify(store));

  if (!API_URL) {
    return localDrawing;
  }

  // Also try to save to cloud
  try {
    const res = await fetch(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl, id }),
    });

    if (res.ok) {
      const cloudDrawing: Drawing = await res.json();
      // Update localStorage with cloud URL
      store[id] = cloudDrawing;
      localStorage.setItem('oekaki_local_data', JSON.stringify(store));
      return cloudDrawing;
    }
  } catch {
    // Cloud save failed, but local save succeeded
  }

  return localDrawing;
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

export async function deleteDrawing(id: string): Promise<void> {
  if (!API_URL) {
    const store = getLocalStore();
    delete store[id];
    localStorage.setItem('oekaki_local_data', JSON.stringify(store));
    return;
  }

  const res = await fetch(`${API_URL}/drawings/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

function getLocalStore(): Record<string, Drawing> {
  try {
    return JSON.parse(localStorage.getItem('oekaki_local_data') || '{}');
  } catch {
    return {};
  }
}
