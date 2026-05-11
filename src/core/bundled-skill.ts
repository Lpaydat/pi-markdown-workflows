import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stripFrontmatter } from "./workflow/path.js";

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    const packageJson = path.join(dir, "package.json");
    try {
      const parsed = JSON.parse(fs.readFileSync(packageJson, "utf-8")) as { name?: unknown };
      if (parsed.name === "@howaboua/pi-markdown-workflows") return dir;
    } catch {
      // keep walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

export async function bundledSkillPrompt(name: string): Promise<string> {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const root = findPackageRoot(moduleDir);
  const skillPath = path.join(root, "skills", name, "SKILL.md");
  const content = await fs.promises.readFile(skillPath, "utf-8");
  const body = stripFrontmatter(content).trim();
  return [`<bundled_skill name="${name}" path="${skillPath}">`, body, `</bundled_skill>`].join(
    "\n",
  );
}
