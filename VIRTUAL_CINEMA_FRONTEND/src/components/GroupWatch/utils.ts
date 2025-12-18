export const makeId = (length = 8) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0126789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://virtualcinemabackend.onrender.com";
export const EMOJI_REACTIONS = ["🍿", "🎬", "👍", "❤️", "😂", "😮", "😢", "👏", "🎉", "🔥"];