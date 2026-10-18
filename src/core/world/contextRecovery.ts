import type * as Phaser from 'phaser';

/**
 * Handles WebGL context loss recovery on mobile devices.
 * Prevents permanent black screens during backgrounding or heavy PDF compilation.
 */
export function registerContextLossRecovery(game: Phaser.Game): void {
  const canvas = game.canvas;
  if (!canvas) return;

  canvas.addEventListener('webglcontextlost', (event: Event) => {
    event.preventDefault(); // Informs the browser that the app handles GPU recovery
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    // Re-bind textures and restart active scenes cleanly
    if (game.renderer && 'pipelines' in game.renderer) {
      const renderer = game.renderer as unknown as { pipelines?: { rebind?: () => void } };
      renderer.pipelines?.rebind?.();
    }
    game.scene?.scenes?.forEach((scene) => {
      if (scene.scene.isActive()) {
        scene.scene.restart();
      }
    });
  }, false);
}
