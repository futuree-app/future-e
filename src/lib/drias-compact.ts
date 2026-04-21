import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

type CompactScenarioValues = {
  h: string;
  p: string;
  dk: number;
  c: "h" | "m" | "l";
  v: Record<string, number>;
};

type CompactCommuneEntry = {
  n: string;
  s: Record<string, CompactScenarioValues>;
};

type CompactDepartmentFile = {
  department: string;
  communes: Record<string, CompactCommuneEntry>;
};

const DATASETS = {
  landing: path.join(process.cwd(), "data/drias/landing/departments"),
  dashboard: path.join(process.cwd(), "data/drias/dashboard/departments"),
} as const;

const departmentCache = new Map<string, CompactDepartmentFile>();

function getDepartmentCode(inseeCode: string) {
  if (inseeCode.startsWith("97")) {
    return inseeCode.slice(0, 3);
  }

  return inseeCode.slice(0, 2);
}

async function readDepartmentFile(dataset: keyof typeof DATASETS, departmentCode: string) {
  const cacheKey = `${dataset}:${departmentCode}`;
  const cached = departmentCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const filename = path.join(DATASETS[dataset], `${departmentCode}.json.gz`);
  const compressed = await fs.readFile(filename);
  const payload = JSON.parse(
    gunzipSync(compressed).toString("utf8"),
  ) as CompactDepartmentFile;

  departmentCache.set(cacheKey, payload);
  return payload;
}

export async function getCompactDriasCommune(
  dataset: keyof typeof DATASETS,
  inseeCode: string,
) {
  const departmentCode = getDepartmentCode(inseeCode);
  const file = await readDepartmentFile(dataset, departmentCode);

  if (!file?.communes?.[inseeCode]) {
    return null;
  }

  return {
    inseeCode,
    departmentCode,
    commune: file.communes[inseeCode],
  };
}
