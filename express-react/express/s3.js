// 要讓 express server 可以登入 AWS s3 來取得或異動檔案
// iam: 創一個 user 代表 web app，讓 web app 可以連結 aws account
// policy: 決定使用者可以訪問的權限和方式。本範例 web app 需要 GetObject(Grants permission to retrieve objects from Amazon S3)、PutObject(Grants permission to add an object to a bucket)、DeleteObject(Grants permission to remove the null version of an object and insert a delete marker, which becomes the current version of the object)

// npm i @aws-sdk/client-s3，用以 interact with the s3 bucket
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";

// dotenv 是透過讀取 .env 檔，把 key-value pair 存到 node.js 下 process.env
dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function uploadFile(fileBuffer, fileName, mimetype) {
  const uploadParams = {
    Bucket: bucketName, // process.env.AWS_BUCKET_NAME
    Body: fileBuffer, // req.file.buffer
    Key: fileName, // req.file.originalname，unique! 如果相同會視為同檔案，蓋過前次檔案，並更新 Last modified。
    ContentType: mimetype, // req.file.mimetype
  };

  // tell s3 to send the command to the s3 bucket
  return s3Client.send(new PutObjectCommand(uploadParams));
}

export function deleteFile(fileName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  return s3Client.send(new DeleteObjectCommand(deleteParams));
}

// 製作 signed url
export async function getObjectSignedUrl(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
  const command = new GetObjectCommand(params);
  const seconds = 60;
  const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

  return url;
}
