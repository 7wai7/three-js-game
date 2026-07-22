import type { InputKey, MouseButton } from './types';

export default class InputManager {
  // keyboard
  private readonly pressedKeys = new Set<InputKey>();
  private readonly clickedKeys = new Set<InputKey>(); // first-frame presses
  private readonly releasedKeys = new Set<InputKey>(); // first-frame releases

  // mouse buttons (0 = left, 1 = middle, 2 = right)
  private readonly pressedMouseButtons = new Set<MouseButton>();
  private readonly clickedMouseButtons = new Set<MouseButton>();
  private readonly releasedMouseButtons = new Set<MouseButton>();

  private readonly _mousePosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  private lockElement: HTMLElement | null = null;
  private _mouseDelta = { x: 0, y: 0 };
  private _wheelDelta = 0;

  constructor() {
    // Обробка руху миші — movementX/movementY доступні лише при lock
    document.addEventListener('mousemove', this.lockMouseMove);
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mousedown', this.mouseDown);
    window.addEventListener('mouseup', this.mouseUp);
    window.addEventListener('wheel', this.wheel, { passive: true });
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('contextmenu', this.onContextMenu);

    // Touch support (map touches to mouse)
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  setLockElement(el: HTMLElement | null) {
    this.lockElement = el;
  }

  // ------------------- public queries -------------------
  pressed(code: InputKey) {
    return this.pressedKeys.has(code);
  }

  clicked(code: InputKey) {
    return this.clickedKeys.has(code);
  }

  released(code: InputKey) {
    return this.releasedKeys.has(code);
  }

  horizontal(): -1 | 0 | 1 {
    return this.pressed('KeyA') ? -1 : this.pressed('KeyD') ? 1 : 0;
  }

  vertical(): -1 | 0 | 1 {
    return this.pressed('KeyS') ? -1 : this.pressed('KeyW') ? 1 : 0;
  }

  // mouse button queries
  isMouseDown(button: MouseButton) {
    return this.pressedMouseButtons.has(button);
  }

  isMouseClicked(button: MouseButton) {
    return this.clickedMouseButtons.has(button);
  }

  isMouseReleased(button: MouseButton) {
    return this.releasedMouseButtons.has(button);
  }

  get mousePosition() {
    return this._mousePosition;
  }

  get mouseDelta() {
    return this._mouseDelta;
  }

  get wheelDelta() {
    return this._wheelDelta;
  }

  // call at start of frame / tick to prepare for new input
  beginFrame() {
    // no-op for now, but could be used for future features like input buffering
  }

  // call at end of frame / tick to clear "single-frame" events
  endFrame() {
    this.clickedKeys.clear();
    this.releasedKeys.clear();
    this.clickedMouseButtons.clear();
    this.releasedMouseButtons.clear();
    // zero deltas
    this._mouseDelta.x = 0;
    this._mouseDelta.y = 0;
    this._wheelDelta = 0;
  }

  // ------------------- internal event handlers -------------------
  private lockMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.lockElement) {
      this._mouseDelta.x += e.movementX;
      this._mouseDelta.y += e.movementY;
    }
  };

  private mouseMove = (e: MouseEvent) => {
    const newX = e.clientX;
    const newY = e.clientY;
    this._mouseDelta.x = newX - (this._mousePosition.x ?? 0);
    this._mouseDelta.y = newY - (this._mousePosition.y ?? 0);
    this._mousePosition.x = newX;
    this._mousePosition.y = newY;
  };

  private mouseDown = (e: MouseEvent) => {
    const b = e.button as MouseButton;
    if (!this.pressedMouseButtons.has(b)) {
      this.clickedMouseButtons.add(b);
    }
    this.pressedMouseButtons.add(b);
  };

  private mouseUp = (e: MouseEvent) => {
    const b = e.button as MouseButton;
    this.pressedMouseButtons.delete(b);
    this.releasedMouseButtons.add(b);
  };

  private wheel = (e: WheelEvent) => {
    // accumulate wheel delta; sign indicates direction
    this._wheelDelta += e.deltaY;
  };

  private keyDown = (e: KeyboardEvent) => {
    const locked = document.pointerLockElement === this.lockElement;

    // Перелік строгих комбінацій які ми хочемо перехопити
    const isCtrlW = (e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W');
    const isCtrlT = (e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T');
    // const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R');
    const isF5 = e.key === 'F5';
    const isTab = e.key === 'Tab';
    const isAlt = e.key === 'Alt'; // Alt окрема клавіша
    const isMeta = e.key === 'Meta'; // Windows/Command

    // Якщо lock — запобігаємо стандартним діям для цих кейсів
    if (locked) {
      if (isCtrlW || isCtrlT /* || isCtrlR */ || isF5 || isTab || isAlt || isMeta) {
        e.preventDefault(); // блокуємо browser action
        e.stopImmediatePropagation(); // запобігаємо даліїй обробці
      }
    }

    const code = e.code as InputKey;

    if (!this.pressedKeys.has(code)) {
      // first-frame press
      this.clickedKeys.add(code);
    }
    this.pressedKeys.add(code);
  };

  private keyUp = (e: KeyboardEvent) => {
    const code = e.code as InputKey;
    this.pressedKeys.delete(code);
    this.releasedKeys.add(code);
  };

  private onContextMenu = (e: Event) => {
    // prevent context menu from breaking right-click handling in games
    // only prevent if right button was pressed recently (heuristic)
    e.preventDefault();
  };

  // ---------- touch handlers (map to mouse) ----------
  private onTouchStart = (e: TouchEvent) => {
    // treat first touch as left mouse down
    if (e.touches.length > 0) {
      const t = e.touches[0];
      const newX = t.clientX;
      const newY = t.clientY;
      this._mouseDelta.x = newX - (this._mousePosition.x ?? 0);
      this._mouseDelta.y = newY - (this._mousePosition.y ?? 0);
      this._mousePosition.x = newX;
      this._mousePosition.y = newY;
      if (!this.pressedMouseButtons.has(0)) this.clickedMouseButtons.add(0);
      this.pressedMouseButtons.add(0);
    }
    e.preventDefault();
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      const newX = t.clientX;
      const newY = t.clientY;
      this._mouseDelta.x = newX - (this._mousePosition.x ?? 0);
      this._mouseDelta.y = newY - (this._mousePosition.y ?? 0);
      this._mousePosition.x = newX;
      this._mousePosition.y = newY;
    }
    e.preventDefault();
  };

  private onTouchEnd = (e: TouchEvent) => {
    // release left mouse
    this.pressedMouseButtons.delete(0);
    this.releasedMouseButtons.add(0);
    e.preventDefault();
  };

  dispose() {
    document.removeEventListener('mousemove', this.lockMouseMove);
    window.removeEventListener('mousemove', this.mouseMove);
    window.removeEventListener('mousedown', this.mouseDown);
    window.removeEventListener('mouseup', this.mouseUp);
    window.removeEventListener('wheel', this.wheel);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('contextmenu', this.onContextMenu);

    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }
}
