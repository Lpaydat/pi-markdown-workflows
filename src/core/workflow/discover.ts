import fs from "node:fs";
import path from "node:path";

import { getAgentDir } from "@earendil-works/pi-coding-agent";

import type { WorkflowDefinition } from "../../types/index.js";
import { parseWorkflowFrontmatter, PRIMARY_WORKFLOW_FILE, PRIMARY_WORKFLOWS_DIR } from "./path.js";

export const GLOBAL_WORKFLOWS_DIR = ["workflows"];

export async function discoverWorkflows(
  cwd: string,
): Promise<{ workflows: WorkflowDefinition[]; checkedDirs: string[] }> {
  const candidates = [
    { root: path.join(cwd, ...PRIMARY_WORKFLOWS_DIR), file: PRIMARY_WORKFLOW_FILE },
    { root: path.join(getAgentDir(), ...GLOBAL_WORKFLOWS_DIR), file: PRIMARY_WORKFLOW_FILE },
  ] as const;
  const workflows: WorkflowDefinition[] = [];
  const checkedDirs: string[] = [];
  const seenNames = new Set<string>();
  for (const candidate of candidates) {
    checkedDirs.push(candidate.root);
    let topEntries: fs.Dirent[];
    try {
      topEntries = await fs.promises.readdir(candidate.root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of topEntries) {
      if (!entry.isDirectory()) continue;
      const workflowPath = path.join(candidate.root, entry.name, candidate.file);
      try {
        const content = await fs.promises.readFile(workflowPath, "utf-8");
        const metadata = parseWorkflowFrontmatter(content);
        if (!metadata) continue;
        if (seenNames.has(metadata.name)) continue;
        seenNames.add(metadata.name);
        workflows.push({ ...metadata, location: workflowPath });
      } catch {
        continue;
      }
    }
  }
  return { workflows, checkedDirs };
}

export function discoverWorkflowsSync(cwd: string): WorkflowDefinition[] {
  const candidates = [
    path.join(cwd, ...PRIMARY_WORKFLOWS_DIR),
    path.join(getAgentDir(), ...GLOBAL_WORKFLOWS_DIR),
  ];
  const workflows: WorkflowDefinition[] = [];
  const seenNames = new Set<string>();
  for (const workflowsRoot of candidates) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(workflowsRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const workflowPath = path.join(workflowsRoot, entry.name, PRIMARY_WORKFLOW_FILE);
      try {
        const content = fs.readFileSync(workflowPath, "utf-8");
        const metadata = parseWorkflowFrontmatter(content);
        if (!metadata) continue;
        if (seenNames.has(metadata.name)) continue;
        seenNames.add(metadata.name);
        workflows.push({ ...metadata, location: workflowPath });
      } catch {
        continue;
      }
    }
  }
  return workflows;
}
