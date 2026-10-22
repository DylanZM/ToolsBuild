import type { BotAvatarType } from "bot-avatars";

export type AiProvider = "gemini" | "deepseek";

export const BOT_APPEARANCES: BotAvatarType[] = [
  "star",
  "drop",
  "cloud",
  "square",
  "pill",
  "blob",
];

export const AI_PROVIDERS: {
  id: AiProvider;
  label: string;
  type: BotAvatarType;
}[] = BOT_APPEARANCES.map((type) => ({ id: "gemini", label: "Bot", type }));

export const isAiProvider = (value: unknown): value is AiProvider =>
  typeof value === "string" && (value === "gemini" || value === "deepseek");

export const AI_LEAD_PROVIDER = AI_PROVIDERS[0];
