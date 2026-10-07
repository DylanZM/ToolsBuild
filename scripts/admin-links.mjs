import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LINKS_FILE = path.join(ROOT, "src", "data", "links.json");
const CATEGORIES_FILE = path.join(ROOT, "src", "data", "categories.json");

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function validate(data, validCategories) {
  if (!Array.isArray(data)) return "El cuerpo debe ser un array de enlaces.";
  const ids = new Set();
  for (const [i, item] of data.entries()) {
    const label = `Enlace #${i + 1}`;
    if (item === null || typeof item !== "object")
      return `${label}: formato inválido.`;
    if (typeof item.id !== "string" || !/^[a-z0-9-]+$/.test(item.id))
      return `${label}: id inválido ("${String(item.id)}").`;
    if (ids.has(item.id)) return `${label}: id duplicado ("${item.id}").`;
    ids.add(item.id);
    if (typeof item.url !== "string" || !/^https?:\/\//.test(item.url))
      return `${label}: url inválida ("${String(item.url)}").`;
    if (typeof item.name !== "string" || !item.name.trim())
      return `${label}: nombre vacío.`;
    if (
      typeof item.category !== "string" ||
      !validCategories.has(item.category)
    )
      return `${label}: categoría desconocida ("${String(item.category)}").`;
    if (
      !Array.isArray(item.tags) ||
      item.tags.some((t) => typeof t !== "string" || !t.trim())
    )
      return `${label}: tags inválidos.`;
    const d = item.desc;
    if (!d || typeof d.es !== "string" || typeof d.en !== "string")
      return `${label}: descripción ES/EN requerida.`;
    if (item.featured !== undefined && typeof item.featured !== "boolean")
      return `${label}: "featured" debe ser verdadero o falso.`;
    if (
      item.addedAt !== undefined &&
      (typeof item.addedAt !== "string" || Number.isNaN(Date.parse(item.addedAt)))
    )
      return `${label}: "addedAt" debe ser una fecha ISO válida.`;
  }
  return null;
}

export function handleAdminLinks(req, res) {
  (async () => {
    if (req.method === "GET") {
      send(res, 200, JSON.parse(await readFile(LINKS_FILE, "utf-8")));
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { ok: false, error: "Método no permitido." });
      return;
    }
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 5_000_000) {
        send(res, 413, { ok: false, error: "Cuerpo demasiado grande." });
        return;
      }
    }
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      send(res, 400, {
        ok: false,
        error: `El cuerpo no es JSON válido (${e.message}).`,
      });
      return;
    }
    const categories = JSON.parse(await readFile(CATEGORIES_FILE, "utf-8"));
    const error = validate(data, new Set(categories.map((c) => c.id)));
    if (error) {
      send(res, 400, { ok: false, error });
      return;
    }
    await writeFile(LINKS_FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");
    send(res, 200, { ok: true });
  })().catch((e) => send(res, 500, { ok: false, error: String(e) }));
}
