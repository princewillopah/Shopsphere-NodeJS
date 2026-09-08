import { S3Storage } from './s3Storage.js';

let instance;

/** Lazily-created singleton StorageService (S3). */
export function getStorage() {
  if (!instance) {
    instance = new S3Storage();
  }
  return instance;
}
