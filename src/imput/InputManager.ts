import type { InputKey, MouseButton } from "./input.types";

class InputManager {
    lockElement: HTMLElement | null = null;

    mousePosition = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };
    mouseDelta = { x: 0, y: 0 };
    wheelDelta = 0;

    // keyboard
    pressedKeys = new Set<InputKey>();
    clickedKeys = new Set<InputKey>(); // first-frame presses
    releasedKeys = new Set<InputKey>(); // first-frame releases

    // mouse buttons (0 = left, 1 = middle, 2 = right)
    pressedMouseButtons = new Set<MouseButton>();
    clickedMouseButtons = new Set<MouseButton>();

    mouseMoveEvent: Set<(position: { x: number, y: number }, delta: { x: number, y: number }) => void> = new Set();
    mouseMoveDeltaEvent: Set<(delta: { x: number, y: number }) => void> = new Set();
    wheelEvent: Set<(delta: number) => void> = new Set();

    init() {
        // Обробка руху миші — movementX/movementY доступні лише при lock
        document.addEventListener('mousemove', this.onLockMouseMove.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: true });
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('contextmenu', this.onContextMenu.bind(this));

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
        return this.pressed("KeyA") ? -1 : this.pressed("KeyD") ? 1 : 0;
    }

    vertical(): -1 | 0 | 1 {
        return this.pressed("KeyS") ? -1 : this.pressed("KeyW") ? 1 : 0;
    }

    // mouse button queries
    isMouseDown(button: MouseButton) {
        return this.pressedMouseButtons.has(button);
    }

    isMouseClicked(button: MouseButton) {
        return this.clickedMouseButtons.has(button);
    }


    // call at end of frame / tick to clear "single-frame" events
    postUpdate() {
        this.clickedKeys.clear();
        this.releasedKeys.clear();
        this.clickedMouseButtons.clear();
        // zero deltas
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.wheelDelta = 0;
    }

    // ------------------- internal event handlers -------------------
    private onLockMouseMove(e: MouseEvent) {
        if (document.pointerLockElement === this.lockElement) {
            this.mouseDelta.x = e.movementX;
            this.mouseDelta.y = e.movementY;

            for (const e of this.mouseMoveDeltaEvent) e(this.mouseDelta);
        }
    }

    private onMouseMove = (e: MouseEvent) => {
        const newX = e.clientX;
        const newY = e.clientY;
        this.mouseDelta.x = newX - (this.mousePosition.x ?? 0);
        this.mouseDelta.y = newY - (this.mousePosition.y ?? 0);
        this.mousePosition.x = newX;
        this.mousePosition.y = newY;

        for (const e of this.mouseMoveEvent) e(this.mousePosition, this.mouseDelta);
    }

    private onMouseDown = (e: MouseEvent) => {
        const b = e.button as MouseButton;
        if (!this.pressedMouseButtons.has(b)) {
            this.clickedMouseButtons.add(b);
        }
        this.pressedMouseButtons.add(b);
    }

    private onMouseUp = (e: MouseEvent) => {
        const b = e.button as MouseButton;
        this.pressedMouseButtons.delete(b);
    }

    private onWheel = (e: WheelEvent) => {
        // accumulate wheel delta; sign indicates direction
        this.wheelDelta += e.deltaY;
        for (const e of this.wheelEvent) e(this.wheelDelta);
    }

    private onKeyDown = (e: KeyboardEvent) => {
        const locked = (document.pointerLockElement === this.lockElement);

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
                e.preventDefault();              // блокуємо browser action
                e.stopImmediatePropagation();    // запобігаємо даліїй обробці
            }
        }

        const code = e.code as InputKey;

        if (!this.pressedKeys.has(code)) {
            // first-frame press
            this.clickedKeys.add(code);
        }
        this.pressedKeys.add(code);
    };

    private onKeyUp = (e: KeyboardEvent) => {
        const code = e.code as InputKey;
        this.pressedKeys.delete(code);
        this.releasedKeys.add(code);
    };

    private onContextMenu = (e: Event) => {
        // prevent context menu from breaking right-click handling in games
        // only prevent if right button was pressed recently (heuristic)
        e.preventDefault();
    }

    // ---------- touch handlers (map to mouse) ----------
    private onTouchStart = (e: TouchEvent) => {
        // treat first touch as left mouse down
        if (e.touches.length > 0) {
            const t = e.touches[0];
            const newX = t.clientX;
            const newY = t.clientY;
            this.mouseDelta.x = newX - (this.mousePosition.x ?? 0);
            this.mouseDelta.y = newY - (this.mousePosition.y ?? 0);
            this.mousePosition.x = newX;
            this.mousePosition.y = newY;
            if (!this.pressedMouseButtons.has(0)) this.clickedMouseButtons.add(0);
            this.pressedMouseButtons.add(0);
        }
        e.preventDefault();
    }

    private onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            const t = e.touches[0];
            const newX = t.clientX;
            const newY = t.clientY;
            this.mouseDelta.x = newX - (this.mousePosition.x ?? 0);
            this.mouseDelta.y = newY - (this.mousePosition.y ?? 0);
            this.mousePosition.x = newX;
            this.mousePosition.y = newY;
        }
        e.preventDefault();
    }

    private onTouchEnd = (e: TouchEvent) => {
        // release left mouse
        this.pressedMouseButtons.delete(0);
        e.preventDefault();
    }

    dispose() {
        document.removeEventListener('mousemove', this.onLockMouseMove);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('contextmenu', this.onContextMenu);

        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
    }
}

export const inputManager = new InputManager();
inputManager.init();