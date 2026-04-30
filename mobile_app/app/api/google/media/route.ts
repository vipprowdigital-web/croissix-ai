// app/api/google/media/route.ts

import { getAuthClient } from "@/lib/googleAuth";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads buffer to Cloudinary and returns { publicUrl, publicId }
// publicId is saved so we can delete the image after Google fetches it
async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
): Promise<{ publicUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        // Store in a dedicated temp folder so it's easy to identify/clean up
        folder: "gbp_temp_uploads",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          publicUrl: result.secure_url, // https URL Google will fetch from
          publicId: result.public_id, // e.g. "gbp_temp_uploads/abc123"
        });
      },
    );
    uploadStream.end(buffer);
  });
}

// Deletes image from Cloudinary by publicId after Google has fetched it
async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    console.log("Cloudinary temp image deleted:", publicId);
  } catch (err) {
    // Non-fatal — log and move on. The gbp_temp_uploads folder can also
    // be bulk-deleted periodically from the Cloudinary dashboard if needed.
    console.warn("Failed to delete Cloudinary temp image:", publicId, err);
  }
}

export async function POST(req: Request) {
  let cloudinaryPublicId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const locationName = formData.get("locationName") as string;
    const category = formData.get("category") as string;
    const authHeader = req.headers.get("authorization");

    console.log("locationName:", locationName);
    console.log("file:", file?.name, file?.type, file?.size);

    if (!file || !locationName) {
      return Response.json(
        { error: "Missing file or locationName" },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const auth = await getAuthClient(authHeader || undefined);
    if (!auth) {
      return Response.json({ error: "Authentication failed" }, { status: 401 });
    }

    const accessToken = auth.credentials.access_token;

    const parts = locationName.split("/");
    if (parts.length < 4) {
      return Response.json(
        {
          error:
            "Invalid locationName. Expected: accounts/{accountId}/locations/{locationId}",
        },
        { status: 400 },
      );
    }

    const accountId = `${parts[0]}/${parts[1]}`; // "accounts/123"
    const locationId = parts[3]; // "456"

    console.log("accountId:", accountId);
    console.log("locationId:", locationId);

    console.log("STEP 1 - Uploading to Cloudinary - Start");
    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicUrl, publicId } = await uploadToCloudinary(buffer, file.type);
    cloudinaryPublicId = publicId;
    console.log("STEP 1 - Cloudinary public URL:", publicUrl);
    console.log("STEP 1 - Cloudinary public ID:", publicId);
    console.log("STEP 1 - Uploading to Cloudinary - End");

    console.log("STEP 2 - Google media.create with sourceUrl - Start");
    const createMedia = await axios.post(
      `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/media`,
      {
        mediaFormat: "PHOTO",
        locationAssociation: {
          category: category || "ADDITIONAL",
        },
        sourceUrl: publicUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("STEP 2 - Google media.create response:", createMedia.data);
    console.log("STEP 2 - Google media.create - End");

    return Response.json(createMedia.data);
  } catch (error: any) {
    console.error("Full error:", JSON.stringify(error.response?.data, null, 2));
    console.error("Error status:", error.response?.status);
    console.error("Request body:", error.config?.data);
    console.error("Request URL:", error.config?.url);
    return Response.json(
      { error: error.response?.data || error.message },
      { status: 500 },
    );
  } finally {
    if (cloudinaryPublicId) {
      console.log("STEP 3 - Deleting temp Cloudinary image - Start");
      // await deleteFromCloudinary(cloudinaryPublicId);
      if (cloudinaryPublicId) {
        // Wait 60 seconds before deleting — Google fetches async
        setTimeout(async () => {
          await deleteFromCloudinary(cloudinaryPublicId!);
        }, 60_000);
      }
      console.log("STEP 3 - Deleting temp Cloudinary image - End");
    }
  }
}

// import { getAuthClient } from "@/lib/googleAuth";
// import axios from "axios";
// import { log } from "console";
// import { google } from "googleapis";

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;
//     const locationName = formData.get("locationName") as string;
//     const category = formData.get("category") as string;
//     const authHeader = req.headers.get("authorization");
//     console.log("authHeader: ", authHeader);
//     console.log("locationName: ", locationName);
//     console.log("file: ", file);

//     if (!file || !locationName) {
//       return Response.json({ error: "Missing data" }, { status: 400 });
//     }

//     // 🚨 Limit file size (Google recommends < 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       return Response.json(
//         { error: "File too large (max 5MB)" },
//         { status: 400 },
//       );
//     }

//     const auth = await getAuthClient(authHeader || undefined);
//     console.log("Auth: ", auth);
//     if (!auth) {
//       return Response.json({ error: "Authentication failed" }, { status: 401 });
//     }

//     const accessToken = auth.credentials.access_token;

//     // const accountService = google.mybusinessaccountmanagement({
//     //   version: "v1",
//     //   auth,
//     // });

//     // const accounts = await accountService.accounts.list();
//     // const accountList = accounts.data.accounts || [];

//     // let accountId: string | null = null;

//     // for (const acc of accountList) {
//     //   const locationsRes = await axios.get(
//     //     `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations`,
//     //     {
//     //       headers: { Authorization: `Bearer ${accessToken}` },
//     //       params: { readMask: "name" },
//     //     },
//     //   );

//     //   const locations = locationsRes.data.locations || [];

//     //   if (locations.find((l: any) => l.name === locationName)) {
//     //     accountId = acc.name ?? null;
//     //     break;
//     //   }
//     // }

//     // if (!accountId) {
//     //   return Response.json(
//     //     { error: "Correct account not found for this location" },
//     //     { status: 400 },
//     //   );
//     // }

//     // console.log("Correct parent account:", accountId);

//     // const locationId = locationName.split("/")[1];

//     // const locationCheck = await axios.get(
//     //   `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}`,
//     //   {
//     //     headers: { Authorization: `Bearer ${accessToken}` },
//     //   },
//     // );

//     // console.log("Location parent verified:", locationCheck.data.name);

//     const parts = locationName.split("/");
//     if (parts.length < 4) {
//       return Response.json(
//         {
//           error:
//             "Invalid locationName format. Expected: accounts/{accountId}/locations/{locationId}",
//         },
//         { status: 400 },
//       );
//     }

//     const accountId = `${parts[0]}/${parts[1]}`; // "accounts/123456789"
//     const locationId = parts[3]; // "987654321"

//     console.log("Extracted accountId:", accountId);
//     console.log("Extracted locationId:", locationId);

//     console.log(
//       "START UPLOAD URL:",
//       `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/media:startUpload`,
//     );
//     // ✅ STEP 1 — Start Upload
//     console.log("STEP 1 - startUpload success - Start");
//     const startUpload = await axios.post(
//       `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/media:startUpload`,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       },
//     );
//     console.log("STEP 1 - startUpload success - End");

//     const resourceName = startUpload.data.resourceName;
//     console.log("resourceName from startUpload:", resourceName);

//     // ✅ STEP 2 — Upload Raw Bytes (CRITICAL FIX)
//     console.log("STEP 2 - upload bytes success - Start");
//     const buffer = Buffer.from(await file.arrayBuffer());

//     const fullResName = `${accountId}/locations/${locationId}/media/${resourceName}`;
//     const encodedResourceName = encodeURIComponent(fullResName);
//     console.log("encodedResourceName:", encodedResourceName);

//     await axios.post(
//       `https://mybusiness.googleapis.com/upload/v1/media/${encodedResourceName}?upload_type=media`,
//       buffer,
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           // "Content-Type": "image/png",
//           "Content-Type": file.type,
//           "Content-Length": buffer.length,
//         },
//         maxBodyLength: Infinity,
//         maxContentLength: Infinity,
//       },
//     );
//     console.log("STEP 2 - upload bytes success - End");

//     // ✅ STEP 3 — Create Media Entry
//     console.log("STEP 3 - create media success - Start");
//     const fullResourceName = `${accountId}/locations/${locationId}/media/${resourceName}`;
//     console.log("fullResourceName for dataRef:", fullResourceName);
//     const createMedia = await axios.post(
//       `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/media`,
//       {
//         mediaFormat: "PHOTO",
//         locationAssociation: {
//           category: category || "ADDITIONAL",
//         },
//         dataRef: {
//           // resourceName: "GoogleProvidedValue",
//           resourceName: fullResourceName,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );
//     console.log("response from createMedia: ", createMedia);

//     console.log("STEP 3 - create media success - End");

//     return Response.json(createMedia.data);
//   } catch (error: any) {
//     console.error("Media upload error:", error.response?.data || error);
//     return Response.json(
//       { error: error.response?.data || error.message },
//       { status: 500 },
//     );
//   }
// }
