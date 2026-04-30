// mobile_app\app\api\auth\callback\route.ts

import { google } from "googleapis";
import axios from "axios";
import { log } from "console";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // For mobile app
  console.log("Search Params: ", searchParams);

  const stateRaw = searchParams.get("state");
  const state = JSON.parse(stateRaw || "{}");
  const platform = state.platform;
  const token = state.token;
  // For mobile app

  const code = searchParams.get("code");
  // const token = searchParams.get("state"); // ✅ JWT

  if (!code || !token) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=oauth_failed`,
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  try {
    // STEP 1: exchange code
    const { tokens } = await oauth2Client.getToken(code);

    // STEP 2: get profile
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: googleProfile } = await oauth2.userinfo.get();

    // STEP 3: send to backend (DB only)
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/link-google`,
      {
        googleId: googleProfile.id,
        email: googleProfile.email,
        name: googleProfile.name,

        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || null,
        googleTokenExpiry: tokens.expiry_date || null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // return Response.redirect(process.env.NEXT_PUBLIC_FRONTEND_URL!);

    // For the Mobile App, we can use a custom URL scheme to redirect back to the app instead of the web frontend
    // if (platform === "mobile") {
    //   console.log("Mobile Redirect.....");
    //   // return Response.redirect(`croissix://oauth-success`);
    //   return new Response(
    //     `
    // <!DOCTYPE html>
    // <html>
    //   <head>
    //     <title>Redirecting...</title>
    //     <style>
    //       body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f4; }
    //       .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
    //       @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    //     </style>
    //   </head>
    //   <body>
    //     <div class="loader"></div>
    //     <script>
    //       // This triggers the deep link back to your Expo app
    //       window.location.href = "croissix://oauth-success?linked=true";

    //       // Fallback: If the app doesn't open in 2 seconds, show a manual button
    //       setTimeout(() => {
    //         document.body.innerHTML = '<button onclick="window.location.href=\\'croissix://oauth-success?linked=true\\'" style="padding: 15px 30px; font-size: 18px;">Return to App</button>';
    //       }, 2000);
    //     </script>
    //   </body>
    // </html>
    // `,
    //     {
    //       headers: { "Content-Type": "text/html" },
    //     },
    //   );
    // }
    if (platform === "mobile") {
      console.log("Mobile Redirect.....");
      return new Response(
        `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connection Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background-color: #ffffff;
            color: #333;
            text-align: center;
          }
          .container { padding: 20px; }
          .success-icon {
            font-size: 64px;
            color: #4BB543;
            margin-bottom: 20px;
          }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { color: #666; margin-bottom: 30px; line-height: 1.5; }
          .btn {
            background-color: #007AFF;
            color: white;
            padding: 14px 28px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            border: none;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Successfully Connected!</h1>
          <p>You can now safely close this window<br>and return to the app.</p>
          
          <button class="btn" onclick="window.location.href='croissix://oauth-success?linked=true'">
            Back to Croissix
          </button>
        </div>

        <script>
          // Attempt auto-redirect immediately
          window.location.href = "croissix://oauth-success?linked=true";
          
          // Optional: Some browsers allow self.close() if the window was opened via JS, 
          // but it's unreliable, so the manual button/message is the safest UX.
        </script>
      </body>
    </html>
    `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    return Response.redirect(process.env.NEXT_PUBLIC_FRONTEND_URL!);
  } catch (error: any) {
    console.error("OAuth Error:", error?.response?.data || error.message);

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=oauth_failed`,
    );
  }
}
