import { Storage } from '@google-cloud/storage';
import { logger } from './logger';

let storage: Storage | null = null;

const getStorageClient = (): Storage => {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
    });
  }
  return storage;
};

export interface GenerateSignedUrlOptions {
  bucket: string;
  objectName: string;
  expiresIn?: number; // milliseconds, default 1 hour
  method?: 'GET' | 'PUT' | 'DELETE';
}

export const generateSignedUrl = async (options: GenerateSignedUrlOptions): Promise<string> => {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(options.bucket);
    const file = bucket.file(options.objectName);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: options.method || 'PUT',
      expires: Date.now() + (options.expiresIn || 3600000), // 1 hour default
    });

    logger.info('Signed URL generated', {
      bucket: options.bucket,
      objectName: options.objectName,
    });

    return url;
  } catch (error) {
    logger.error('Failed to generate signed URL', error as Error, {
      bucket: options.bucket,
      objectName: options.objectName,
    });
    throw error;
  }
};

export interface UploadOptions {
  bucket: string;
  objectName: string;
  file: Buffer | string;
  metadata?: Record<string, any>;
}

export const uploadFile = async (options: UploadOptions): Promise<void> => {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(options.bucket);
    const file = bucket.file(options.objectName);

    await file.save(options.file, {
      metadata: options.metadata,
    });

    logger.info('File uploaded to GCS', {
      bucket: options.bucket,
      objectName: options.objectName,
    });
  } catch (error) {
    logger.error('Failed to upload file to GCS', error as Error, {
      bucket: options.bucket,
      objectName: options.objectName,
    });
    throw error;
  }
};

export interface DeleteOptions {
  bucket: string;
  objectName: string;
}

export const deleteFile = async (options: DeleteOptions): Promise<void> => {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(options.bucket);
    const file = bucket.file(options.objectName);

    await file.delete();

    logger.info('File deleted from GCS', {
      bucket: options.bucket,
      objectName: options.objectName,
    });
  } catch (error) {
    logger.error('Failed to delete file from GCS', error as Error, {
      bucket: options.bucket,
      objectName: options.objectName,
    });
    throw error;
  }
};

export interface GetFileMetadataOptions {
  bucket: string;
  objectName: string;
}

export const getFileMetadata = async (
  options: GetFileMetadataOptions
): Promise<Record<string, any> | null> => {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(options.bucket);
    const file = bucket.file(options.objectName);

    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    logger.warn('Failed to get file metadata from GCS', {
      bucket: options.bucket,
      objectName: options.objectName,
    });
    return null;
  }
};
