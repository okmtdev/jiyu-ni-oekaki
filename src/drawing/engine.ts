export type ToolType = 'pen' | 'marker' | 'brush' | 'eraser' | 'stamp';

interface Point {
  x: number;
  y: number;
}

export class DrawingEngine {
  private canvas: HTMLCanvasElement;
  private tempCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tempCtx: CanvasRenderingContext2D;
  private container: HTMLElement;

  private isDrawing = false;
  private points: Point[] = [];
  private history: ImageData[] = [];
  private historyIndex = -1;
  private readonly maxHistory = 30;

  tool: ToolType = 'pen';
  color = '#000000';
  size = 8;
  stampEmoji = '⭐';

  constructor(container: HTMLElement) {
    this.container = container;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'drawing-canvas';
    container.appendChild(this.canvas);

    this.tempCanvas = document.createElement('canvas');
    this.tempCanvas.className = 'drawing-canvas drawing-canvas--temp';
    container.appendChild(this.tempCanvas);

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.tempCtx = this.tempCanvas.getContext('2d')!;

    this.resize();
    this.setupEvents();
    this.saveState();
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    let imageData: ImageData | null = null;
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    this.canvas.width = w;
    this.canvas.height = h;
    this.tempCanvas.width = w;
    this.tempCanvas.height = h;

    // Fill white background
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, w, h);

    if (imageData) {
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  private getPos(e: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private setupEvents() {
    const el = this.tempCanvas;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      this.startStroke(this.getPos(e));
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.continueStroke(this.getPos(e));
    });

    el.addEventListener('pointerup', (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.endStroke();
    });

    el.addEventListener('pointercancel', () => {
      if (this.isDrawing) this.endStroke();
    });
  }

  private startStroke(point: Point) {
    this.isDrawing = true;
    this.points = [point];
    this.saveState();

    if (this.tool === 'stamp') {
      this.placeStamp(point);
      this.isDrawing = false;
      return;
    }

    this.renderCurrentStroke();
  }

  private continueStroke(point: Point) {
    this.points.push(point);
    this.renderCurrentStroke();
  }

  private endStroke() {
    this.isDrawing = false;

    if (this.tool === 'pen' || this.tool === 'marker') {
      this.ctx.drawImage(this.tempCanvas, 0, 0);
      this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    }

    this.points = [];
  }

  private renderCurrentStroke() {
    switch (this.tool) {
      case 'pen':
      case 'marker':
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.drawStrokeOnCtx(this.tempCtx);
        break;
      case 'brush':
        this.drawBrushSegment();
        break;
      case 'eraser':
        this.drawEraserSegment();
        break;
    }
  }

  private drawStrokeOnCtx(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.save();

    if (this.tool === 'pen') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1;
    } else if (this.tool === 'marker') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 3;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.35;
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    if (this.points.length === 1) {
      ctx.lineTo(this.points[0].x + 0.1, this.points[0].y);
    } else {
      for (let i = 1; i < this.points.length; i++) {
        const prev = this.points[i - 1];
        const curr = this.points[i];
        const mid = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 };
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
      }
      const last = this.points[this.points.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  private drawBrushSegment() {
    const ctx = this.ctx;
    const radius = this.size * 1.5;

    let from: Point;
    let to: Point;

    if (this.points.length === 1) {
      from = this.points[0];
      to = this.points[0];
    } else {
      from = this.points[this.points.length - 2];
      to = this.points[this.points.length - 1];
    }

    const dist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    const steps = Math.max(1, Math.ceil(dist / (this.size * 0.3)));

    ctx.save();
    ctx.fillStyle = this.color;

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      for (let j = 0; j < 3; j++) {
        const ox = (Math.random() - 0.5) * this.size;
        const oy = (Math.random() - 0.5) * this.size;
        ctx.globalAlpha = 0.06 + Math.random() * 0.06;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawEraserSegment() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = this.size * 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1;

    if (this.points.length === 1) {
      ctx.beginPath();
      ctx.arc(this.points[0].x, this.points[0].y, this.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    } else {
      const prev = this.points[this.points.length - 2];
      const curr = this.points[this.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private placeStamp(point: Point) {
    const ctx = this.ctx;
    const stampSize = this.size * 5;
    ctx.save();
    ctx.font = `${stampSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.stampEmoji, point.x, point.y);
    ctx.restore();
  }

  private saveState() {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.history.push(imageData);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.historyIndex = this.history.length - 1;
  }

  undo(): boolean {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
    return true;
  }

  clear() {
    this.saveState();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  destroy() {
    this.canvas.remove();
    this.tempCanvas.remove();
    this.history = [];
  }
}
