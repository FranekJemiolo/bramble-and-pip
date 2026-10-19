import { describe, it, expect } from 'vitest';
import {
  MAP_DEFINITIONS,
  createCollisionGridForMap,
  getMapIdForChapter,
  type MapId,
} from '../../src/core/world/mapData';
import { TilePathfindingManager } from '../../src/core/world/pathfinding';

describe('Map Definitions & Collision Grids', () => {
  const mapIds: MapId[] = [
    'whispering_woods',
    'mossy_gearbox',
    'mossy_hollow',
    'pine_ridge',
    'ranger_lodge',
    'ranger_cabin',
    'pebble_creek',
    'sunset_meadow',
  ];

  it('every map has exactly 20x12 collision rows of matching width', () => {
    for (const id of mapIds) {
      const def = MAP_DEFINITIONS[id];
      expect(def).toBeDefined();
      expect(def.collisionRows).toHaveLength(12);
      for (let r = 0; r < def.collisionRows.length; r++) {
        expect(def.collisionRows[r]).toHaveLength(20);
      }
    }
  });

  it('trees and major obstacles are strictly solid', () => {
    // Whispering Woods: big oak tree on right (cols 14..18, rows 0..3) must be solid
    const wwGrid = createCollisionGridForMap('whispering_woods');
    expect(wwGrid.isSolid(16, 1)).toBe(true);
    expect(wwGrid.isSolid(17, 2)).toBe(true);
    // Trail (col 3, row 2) must be walkable
    expect(wwGrid.isSolid(3, 2)).toBe(false);

    // Mossy Gearbox: waterwheel (cols 3..5, rows 2..5) must be solid
    const gbGrid = createCollisionGridForMap('mossy_gearbox');
    expect(gbGrid.isSolid(4, 3)).toBe(true);
    // Clearing around pegs (col 8, row 6) must be walkable
    expect(gbGrid.isSolid(8, 6)).toBe(false);

    // Pine Ridge: dense pine forest (col 14, row 4) must be solid
    const prGrid = createCollisionGridForMap('pine_ridge');
    expect(prGrid.isSolid(14, 4)).toBe(true);
    // Snow trail (col 2, row 5) must be walkable
    expect(prGrid.isSolid(2, 5)).toBe(false);

    // Ranger Lodge: fireplace (col 3, row 3) and sleeping bear (col 2, row 8) must be solid
    const rlGrid = createCollisionGridForMap('ranger_lodge');
    expect(rlGrid.isSolid(3, 3)).toBe(true);
    expect(rlGrid.isSolid(2, 8)).toBe(true);
    // Floor (col 6, row 5) must be walkable
    expect(rlGrid.isSolid(6, 5)).toBe(false);

    // Ranger Cabin: desk / fireplace (col 2, row 2) must be solid, center floor (col 6, row 5) walkable
    const rcGrid = createCollisionGridForMap('ranger_cabin');
    expect(rcGrid.isSolid(6, 5)).toBe(false);

    // Sunset Meadow: entrance road (col 0, row 9) walkable
    const smGrid = createCollisionGridForMap('sunset_meadow');
    expect(smGrid.isSolid(0, 9)).toBe(false);
  });

  it('default spawn point is always on a walkable tile for every map', () => {
    for (const id of mapIds) {
      const def = MAP_DEFINITIONS[id];
      const grid = createCollisionGridForMap(id);
      const tileX = Math.floor(def.defaultSpawn.x / 16);
      const tileY = Math.floor(def.defaultSpawn.y / 16);
      expect(grid.isSolid(tileX, tileY), `Spawn ${def.defaultSpawn.x},${def.defaultSpawn.y} (tile ${tileX},${tileY}) on ${id} must be walkable`).toBe(false);
    }
  });

  it('exits point to valid targets, have valid directions, and walkable target spawns', () => {
    for (const id of mapIds) {
      const def = MAP_DEFINITIONS[id];
      for (const exit of def.exits) {
        expect(MAP_DEFINITIONS[exit.targetMap]).toBeDefined();
        expect(['east', 'west', 'north', 'south', 'door']).toContain(exit.direction);
        const targetGrid = createCollisionGridForMap(exit.targetMap);
        const spawnTileX = Math.floor(exit.targetSpawn.x / 16);
        const spawnTileY = Math.floor(exit.targetSpawn.y / 16);
        expect(targetGrid.isSolid(spawnTileX, spawnTileY), `Exit target spawn on ${exit.targetMap} (tile ${spawnTileX},${spawnTileY}) must be walkable`).toBe(false);

        // Assert symmetrical return exit exists on target map
        const targetDef = MAP_DEFINITIONS[exit.targetMap];
        const returnExit = targetDef.exits.find((e) => e.targetMap === id);
        expect(returnExit, `Return exit from ${exit.targetMap} back to ${id} must exist`).toBeDefined();
      }
    }
  });

  it('pathfinding navigates along walkable trails on all maps', () => {
    for (const id of mapIds) {
      const def = MAP_DEFINITIONS[id];
      const grid = createCollisionGridForMap(id);
      const pf = new TilePathfindingManager(grid);
      const startX = Math.floor(def.defaultSpawn.x / 16);
      const startY = Math.floor(def.defaultSpawn.y / 16);

      // Find another walkable tile
      let targetX = startX;
      let targetY = startY;
      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 20; x++) {
          if (!grid.isSolid(x, y) && (x !== startX || y !== startY)) {
            targetX = x;
            targetY = y;
            break;
          }
        }
      }

      const path = pf.findTilePath({ x: startX, y: startY }, { x: targetX, y: targetY });
      expect(path, `Path from ${startX},${startY} to ${targetX},${targetY} on ${id} should exist`).not.toBeNull();
      expect(path!.length).toBeGreaterThan(0);
      for (const wp of path!) {
        expect(grid.isSolid(wp.x, wp.y), `Tile ${wp.x},${wp.y} in path on ${id} must not be solid`).toBe(false);
      }
    }
  });

  it('maps all 20 chapters to authentic regions', () => {
    expect(getMapIdForChapter(1)).toBe('whispering_woods');
    expect(getMapIdForChapter(5)).toBe('whispering_woods');
    expect(getMapIdForChapter(7)).toBe('mossy_gearbox');
    expect(getMapIdForChapter(9)).toBe('mossy_hollow');
    expect(getMapIdForChapter(12)).toBe('sketchbook');
    expect(getMapIdForChapter(14)).toBe('mossy_hollow');
    expect(getMapIdForChapter(17)).toBe('pine_ridge');
    expect(getMapIdForChapter(20)).toBe('ranger_lodge');
  });
});
