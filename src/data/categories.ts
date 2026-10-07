export interface Category {
  id: string;
  slug: string;
  order: number;
  name: { es: string; en: string };
  short: { es: string; en: string };
  desc: { es: string; en: string };
}

export const categories: Category[] = [
  {
    id: "inspiration",
    slug: "inspiration",
    order: 1,
    name: { es: "Inspiración", en: "Inspiration" },
    short: { es: "Inspiración", en: "Inspiration" },
    desc: {
      es: "Galerías de diseño, plantillas, generadores de DESIGN.md y webs que vale la pena estudiar.",
      en: "Design galleries, templates, DESIGN.md generators and websites worth studying.",
    },
  },
  {
    id: "components",
    slug: "components",
    order: 2,
    name: { es: "Componentes", en: "Components" },
    short: { es: "Componentes", en: "Components" },
    desc: {
      es: "Librerías y registros de componentes React, bloques y patrones listos para copiar.",
      en: "React libraries and registries, blocks and patterns ready to copy.",
    },
  },
  {
    id: "icons",
    slug: "icons",
    order: 3,
    name: { es: "Iconos", en: "Icons" },
    short: { es: "Iconos", en: "Icons" },
    desc: {
      es: "Set de iconos, logos y iconos animados para cualquier interfaz.",
      en: "Icon sets, logos and animated icons for any interface.",
    },
  },
  {
    id: "motion",
    slug: "motion",
    order: 4,
    name: { es: "Animaciones", en: "Animations" },
    short: { es: "Animaciones", en: "Animations" },
    desc: {
      es: "Micro-interacciones, animaciones, loaders, sonidos y efectos para dar vida a la UI.",
      en: "Micro-interactions, animations, loaders, sounds and effects to bring UI to life.",
    },
  },
  {
    id: "visuals",
    slug: "visuals",
    order: 5,
    name: { es: "Visuales", en: "Visuals" },
    short: { es: "Visuales", en: "Visuals" },
    desc: {
      es: "Tipografías, fondos, avatares, mascotas y recursos visuales en general.",
      en: "Typefaces, backgrounds, avatars, mascots and general visual resources.",
    },
  },
  {
    id: "ai",
    slug: "ai",
    order: 6,
    name: { es: "IA y lenguaje de máquina", en: "AI & machine learning" },
    short: { es: "IA", en: "AI" },
    desc: {
      es: "Modelos, agentes, generación de imágenes/video y workspaces de IA.",
      en: "Models, agents, image/video generation and AI workspaces.",
    },
  },
  {
    id: "build",
    slug: "build",
    order: 7,
    name: { es: "Construcción", en: "Build" },
    short: { es: "Construir", en: "Build" },
    desc: {
      es: "Utilidades de desarrollo, servicios gratuitos y herramientas para construir más rápido.",
      en: "Developer utilities, free services and tools to build faster.",
    },
  },
  {
    id: "learn",
    slug: "learn",
    order: 8,
    name: { es: "Aprendizaje", en: "Learning" },
    short: { es: "Aprender", en: "Learn" },
    desc: {
      es: "Cursos, agent skills y material para seguir aprendiendo.",
      en: "Courses, agent skills and material to keep learning.",
    },
  },
];

export const categoryById = new Map(categories.map((c) => [c.id, c]));

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
