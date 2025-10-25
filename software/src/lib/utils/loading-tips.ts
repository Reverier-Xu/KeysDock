import { t } from "@storage/theme";

export function randomTips(prev?: string): string {
  const randomIndex = Math.floor(Math.random() * 16);
  const tip: string = t(`general.loading.${randomIndex.toString().padStart(2, "0")}`);
  return tip === prev ? t(`general.loading.${((randomIndex + 1) % 16).toString().padStart(2, "0")}`) : tip;
}
