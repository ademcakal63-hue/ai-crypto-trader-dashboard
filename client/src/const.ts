export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "AI Crypto Trader";

export const APP_LOGO = "https://placehold.co/128x128/1a1a1a/d4a017?text=AI";

// Login URL - artık basit login sayfasına yönlendir
export const getLoginUrl = () => {
  return "/login";
};
