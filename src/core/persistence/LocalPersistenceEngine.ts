import { SAVE_SCHEMA_VERSION } from '../constants';

export interface SaveRecord<T> {
  version: number;
  timestamp: number;
  crc32: number;
  data: T;
}

/**
 * Pure bitwise CRC32 calculation.
 */
export function calculateCRC32(asciiOrJson: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < asciiOrJson.length; i++) {
    const byte = asciiOrJson.charCodeAt(i) & 0xff;
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStore implements StorageAdapter {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class IndexedDBStore implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly dbName = 'bramble_pip_db',
    private readonly storeName = 'save_store'
  ) {}

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getItem(key: string): Promise<string | null> {
    const db = await this.getDB();
    return new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

/**
 * Double-buffered Atomic Persistence Engine with CRC32 checksums
 * and seamless fallback for Safari Private Browsing.
 */
export class LocalPersistenceEngine<T> {
  private readonly storage: StorageAdapter;
  private readonly keyPrefix: string;

  constructor(keyPrefix = 'bramble_pip', storage?: StorageAdapter) {
    this.keyPrefix = keyPrefix;
    if (storage) {
      this.storage = storage;
    } else if (typeof indexedDB !== 'undefined') {
      this.storage = new IndexedDBStore();
    } else {
      this.storage = new MemoryStore();
    }
  }

  private get stagingKey(): string {
    return `${this.keyPrefix}_staging`;
  }
  private get primaryKey(): string {
    return `${this.keyPrefix}_primary`;
  }
  private get backupKey(): string {
    return `${this.keyPrefix}_backup`;
  }

  /**
   * Atomic double-buffered write:
   * 1. Write to staging with CRC32.
   * 2. Verify staging readback and CRC32 match.
   * 3. Copy current primary to backup.
   * 4. Promote staging to primary.
   */
  async save(data: T): Promise<boolean> {
    try {
      const serializedData = JSON.stringify(data);
      const crc = calculateCRC32(serializedData);
      const record: SaveRecord<T> = {
        version: SAVE_SCHEMA_VERSION,
        timestamp: Date.now(),
        crc32: crc,
        data,
      };
      const recordString = JSON.stringify(record);

      // 1. Write staging
      await this.storage.setItem(this.stagingKey, recordString);

      // 2. Verify staging readback
      const stagingCheck = await this.storage.getItem(this.stagingKey);
      if (!stagingCheck) return false;

      const parsedStaging = JSON.parse(stagingCheck) as SaveRecord<T>;
      if (calculateCRC32(JSON.stringify(parsedStaging.data)) !== parsedStaging.crc32) {
        return false; // Staging corrupt! Never overwrite primary.
      }

      // 3. Backup primary if exists
      const existingPrimary = await this.storage.getItem(this.primaryKey);
      if (existingPrimary) {
        await this.storage.setItem(this.backupKey, existingPrimary);
      }

      // 4. Promote staging to primary
      await this.storage.setItem(this.primaryKey, recordString);
      await this.storage.removeItem(this.stagingKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Loads save data with automatic recovery from backup on CRC32 corruption.
   */
  async load(): Promise<T | null> {
    try {
      // 1. Attempt primary load
      const primaryRaw = await this.storage.getItem(this.primaryKey);
      if (primaryRaw) {
        const primaryRecord = this.validateRecord(primaryRaw);
        if (primaryRecord) {
          return primaryRecord.data;
        }
      }

      // 2. Primary missing or corrupt -> attempt recovery from backup
      const backupRaw = await this.storage.getItem(this.backupKey);
      if (backupRaw) {
        const backupRecord = this.validateRecord(backupRaw);
        if (backupRecord) {
          // Restore primary from backup
          await this.storage.setItem(this.primaryKey, backupRaw);
          return backupRecord.data;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private validateRecord(rawJson: string): SaveRecord<T> | null {
    try {
      const record = JSON.parse(rawJson) as SaveRecord<T>;
      if (!record || typeof record !== 'object') return null;
      if (record.version !== SAVE_SCHEMA_VERSION) return null;

      const expectedCrc = calculateCRC32(JSON.stringify(record.data));
      if (record.crc32 !== expectedCrc) {
        return null; // CRC mismatch
      }
      return record;
    } catch {
      return null;
    }
  }

  async clearAll(): Promise<void> {
    await this.storage.removeItem(this.stagingKey);
    await this.storage.removeItem(this.primaryKey);
    await this.storage.removeItem(this.backupKey);
  }
}
