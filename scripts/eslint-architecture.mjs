import path from "node:path";

const layers = new Set(["app", "features", "entities", "infrastructure", "shared"]);
const allowed = {
  app: ["app", "features", "entities", "shared"],
  features: ["features", "entities", "infrastructure", "shared"],
  entities: ["entities", "infrastructure", "shared"],
  infrastructure: ["infrastructure", "shared"],
  shared: ["shared"],
};

export function architectureViolation(importer, target) {
  const [fromLayer, fromModule] = importer.split("/");
  const [toLayer, toModule, ...subpath] = target.split("/");
  if (!layers.has(fromLayer)) return null;
  if (!allowed[fromLayer].includes(toLayer)) return "upward";
  if (fromLayer === "features" && toLayer === "features" && fromModule !== toModule) {
    return "crossFeature";
  }
  if (toLayer === "features" && fromLayer !== "features") {
    if (subpath.length && !/^index(?:\.[cm]?[jt]sx?)?$/.test(subpath.join("/"))) {
      return "privateApi";
    }
  }
  if (toLayer === "entities" && !(fromLayer === "entities" && fromModule === toModule)) {
    if (subpath.length && !/^index(?:\.[cm]?[jt]sx?)?$/.test(subpath.join("/"))) {
      return "privateApi";
    }
    if (fromLayer === "entities" && !(fromModule === "sale" && toModule === "product")) {
      return "entityDependency";
    }
  }
  return null;
}

export const architectureRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      upward: "Esta dependencia viola las capas definidas en FEATURE-ARCH-TARGET.md.",
      crossFeature:
        "Las funcionalidades se coordinan desde app; no importan otras funcionalidades.",
      privateApi: "Importá la API pública index.ts; este archivo es interno al módulo.",
      entityDependency: "La única dependencia entre entidades permitida es sale → product.",
    },
  },
  create(context) {
    const root = context.cwd;
    const filename = context.filename;
    const normalize = (value) => path.relative(root, value).split(path.sep).join("/");
    const importer = normalize(filename);
    function check(node, source) {
      if (!source || typeof source.value !== "string") return;
      const value = source.value;
      const target = value.startsWith("@/")
        ? path.resolve(root, value.slice(2))
        : value.startsWith(".")
          ? path.resolve(path.dirname(filename), value)
          : null;
      if (!target) return;
      const messageId = architectureViolation(importer, normalize(target));
      if (messageId) context.report({ node, messageId });
    }
    return {
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source),
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require") {
          check(node, node.arguments[0]);
        }
      },
    };
  },
};
