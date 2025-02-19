import { DatasetFile } from "@/service/dataset/type.ts";

export function getDuration(file?: DatasetFile) {
  if (!file) return 0;
  const start = new Date(file.start).getTime() / 1000;
  const end = new Date(file.end).getTime() / 1000;
  return end - start;
}