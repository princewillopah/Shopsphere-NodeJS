import { randomUUID } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import env from '../config/env.js';
import { BadRequestError } from '../utils/AppError.js';

const SAFE = /[^a-zA-Z0-9._-]/g;

/**
 * Stores images in AWS S3 and returns their public URL. When a public base URL
 * (e.g. a CloudFront domain) is configured it is used to build the URL,
 * otherwise the standard S3 virtual-hosted URL is used. On EC2, credentials come
 * from the instance IAM role (no static keys).
 */
export class S3Storage {
  constructor() {
    this.client = new S3Client({ region: env.storage.region });
  }

  async upload(file) {
    if (!file) {
      throw new BadRequestError('No image file provided');
    }
    if (!env.storage.bucket) {
      throw new Error('S3_BUCKET is not configured');
    }

    const cleaned = (file.originalname || 'image').replace(SAFE, '_');
    const key = `${env.storage.keyPrefix}${randomUUID()}-${cleaned}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.storage.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      })
    );
    return this.#buildUrl(key);
  }

  async getAccessibleUrl(image) {
    if (!image || typeof image !== 'string') {
      return image;
    }

    if (!env.storage.bucket) {
      return image;
    }

    const bucketHost = `${env.storage.bucket}.s3.${env.storage.region}.amazonaws.com`;
    const isS3HostedUrl = image.includes(bucketHost) || image.includes(`s3.${env.storage.region}.amazonaws.com/${env.storage.bucket}/`);
    if (!isS3HostedUrl) {
      return image;
    }

    const parsed = new URL(image);
    let key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    if (key.startsWith(`${env.storage.bucket}/`)) {
      key = key.replace(`${env.storage.bucket}/`, '');
    }

    const command = new GetObjectCommand({
      Bucket: env.storage.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async #buildUrl(key) {
    if (env.storage.publicBaseUrl) {
      return `${env.storage.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    return this.getAccessibleUrl(`https://${env.storage.bucket}.s3.${env.storage.region}.amazonaws.com/${key}`);
  }
}
