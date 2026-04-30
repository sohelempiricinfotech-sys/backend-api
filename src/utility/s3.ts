import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION, // can be anything for MinIO
  endpoint: process.env.AWS_S3_ENDPOINT, // IMPORTANT
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // VERY IMPORTANT for MinIO
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

const uploadFileToS3 = async (
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
};

const getFileUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

const deleteFileFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Generate the S3 key for a user's profile photo.
 * Convention: profile-photos/<userId>.webp
 */
const getProfilePhotoKey = (userId: number): string => {
  return `profile-photos/${userId}.webp`;
};

/**
 * Generate a signed URL for a user's profile photo using their userId.
 * No DB lookup needed — the key is deterministic.
 */
const getProfilePhotoSignedUrl = async (userId: number): Promise<string> => {
  return getFileUrl(getProfilePhotoKey(userId));
};

const getOrgLogoKey = (orgId: number): string => {
  return `org-logos/${orgId}.webp`;
};

const getOrgLogoSignedUrl = async (orgId: number): Promise<string> => {
  return getFileUrl(getOrgLogoKey(orgId));
};

const getFileBuffer = async (key: string): Promise<Buffer> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export {
  uploadFileToS3,
  getFileUrl,
  deleteFileFromS3,
  getProfilePhotoKey,
  getProfilePhotoSignedUrl,
  getOrgLogoKey,
  getOrgLogoSignedUrl,
  getFileBuffer,
};
