// mobile_app\app\api\upload\route.ts

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  console.log("Inside api/upload...");
  console.log("Formdata: ", formData);

  const file = formData.get("file") as File;
  console.log("file: ", file);

  const buffer = Buffer.from(await file.arrayBuffer());
  console.log("Buffer: ", buffer);

  const upload = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "gmb-posts" }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
      .end(buffer);
  });
  console.log("Upload: ", upload);

  return Response.json(upload);
}
