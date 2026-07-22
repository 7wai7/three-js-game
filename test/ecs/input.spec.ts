import { describe, expect, it, vi } from 'vitest';

import ControlInput from '../../src/engine/components/control-input';
import PlayerControlled from '../../src/engine/components/player-controlled';
import EngineContext from '../../src/engine/contexts/engine.context';
import World from '../../src/engine/ecs/world';
import type Engine from '../../src/engine/engine';
import InputLayer from '../../src/engine/input/input-layer';
import type InputManager from '../../src/engine/input/input-manager';
import PlayerInputSystem from '../../src/engine/systems/input-controllers/player-input.system';

function createRawInput() {
  return {
    /* eslint-disable */
    pressed: vi.fn((_code: string) => false),
    clicked: vi.fn((_code: string) => false),
    released: vi.fn((_code: string) => false),
    isMouseDown: vi.fn((_button: number) => false),
    isMouseClicked: vi.fn((_button: number) => false),
    isMouseReleased: vi.fn((_button: number) => false),
    /* eslint-enable */
  };
}

describe('input layers', () => {
  it('maps raw input to semantic actions', () => {
    const rawInput = createRawInput();
    rawInput.pressed.mockImplementation((code) => code === 'KeyD');
    rawInput.clicked.mockImplementation((code) => code === 'Space');
    rawInput.isMouseDown.mockImplementation((button) => button === 0);

    const layer = new InputLayer(rawInput as unknown as InputManager, {
      axes: {
        moveX: {
          negative: { device: 'keyboard', code: 'KeyA' },
          positive: { device: 'keyboard', code: 'KeyD' },
        },
      },
      buttons: {
        jump: [{ device: 'keyboard', code: 'Space' }],
        firePrimary: [{ device: 'mouse', button: 0 }],
      },
    });

    expect(layer.axis('moveX')).toBe(1);
    expect(layer.clicked('jump')).toBe(true);
    expect(layer.pressed('firePrimary')).toBe(true);
  });

  it('writes a reusable control input snapshot for player controlled entities', () => {
    const world = new World();
    const rawInput = createRawInput();
    rawInput.pressed.mockImplementation((code) => code === 'KeyW');
    rawInput.isMouseClicked.mockImplementation((button) => button === 0);

    const layer = new InputLayer(rawInput as unknown as InputManager, {
      axes: {
        moveY: {
          negative: { device: 'keyboard', code: 'KeyS' },
          positive: { device: 'keyboard', code: 'KeyW' },
        },
      },
      buttons: {
        firePrimary: [{ device: 'mouse', button: 0 }],
      },
    });

    const engine = {
      world,
      input: rawInput,
      deltaTime: 1 / 60,
      getInputLayer: () => layer,
    } as unknown as Engine;

    EngineContext.setEngine(engine);

    world.addSystem(new PlayerInputSystem());

    const entity = world.createEntity('player');
    world.addComponent(entity, new PlayerControlled());

    world.update();
    world.update();

    const input = world.getComponent(entity, ControlInput)!;

    expect(input.axis('moveY')).toBe(1);
    expect(input.clicked('firePrimary')).toBe(true);
  });
});
