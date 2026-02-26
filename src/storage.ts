const STORAGE_KEY = 'oekaki_my_drawings';

export function getMyDrawingIds(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addDrawingId(id: string): void {
  const ids = getMyDrawingIds();
  ids.unshift(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function removeDrawingId(id: string): void {
  const ids = getMyDrawingIds().filter((i) => i !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
