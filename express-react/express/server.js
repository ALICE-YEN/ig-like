import express from "express";

import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";

import { PrismaClient } from "@prisma/client";
import { uploadFile, deleteFile, getObjectSignedUrl } from "./s3.js";

const app = express();
const prisma = new PrismaClient();

// 本例採用 MemoryStorage，存放圖片在 memory，可以在 memory modify、validate 圖片，然後直接傳送到 s3 而不用存在 file system on the node server
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 因為希望 key 是唯一值，傳送的圖檔就不會被覆蓋，所以用 crypto 產生亂碼
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// http://localhost:8080/api/posts
app.get("/api/posts", async (req, res) => {
  const posts = await prisma.posts.findMany({ orderBy: [{ created: "desc" }] });
  for (let post of posts) {
    // 製作 signed url，並放入 post 欄位 imageUrl
    post.imageUrl = await getObjectSignedUrl(post.imageName);
  }
  res.send(posts);
});

// upload.single 內的字串是上傳 image 定義的 name。ex: html input name、react formData.append("image", file)
app.post("/api/posts", upload.single("image"), async (req, res) => {
  // image 詳細資訊顯示在 req.file，精華是 buffer
  const file = req.file;
  // caption 顯示在 req.body
  const caption = req.body.caption;
  const imageName = generateFileName();
  // const imageName = req.file.originalname;

  // image resize
  // 先傳圖片到 server，再傳到 s3 前，可以先 resize 圖片
  const fileBuffer = await sharp(file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer();

  await uploadFile(fileBuffer, imageName, file.mimetype);

  const post = await prisma.posts.create({
    data: {
      imageName,
      caption,
    },
  });

  // send the post back down to the client
  res.status(201).send(post);
});

app.delete("/api/posts/:id", async (req, res) => {
  const id = +req.params.id;
  const post = await prisma.posts.findUnique({ where: { id } });

  // delete from s3
  await deleteFile(post.imageName);

  // delete from database
  await prisma.posts.delete({ where: { id: post.id } });
  res.send(post);
});

app.listen(8080, () => console.log("listening on port 8080"));
