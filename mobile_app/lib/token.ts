// mobile_app\lib\token.ts

export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
