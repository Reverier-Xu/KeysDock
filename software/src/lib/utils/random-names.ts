import { leet } from "@api/rpc";
import chuunibyou from "./names/chuunibyou";
import hacker from "./names/hacker";

async function generate(dict: { prefix: string[]; semi: string[]; suffix: string[]; withLeet: boolean }) {
  const prefix = dict.prefix[Math.floor(Math.random() * dict.prefix.length)];
  const semi = dict.semi[Math.floor(Math.random() * dict.semi.length)];
  const suffix = dict.suffix[Math.floor(Math.random() * dict.suffix.length)];
  if (!dict.withLeet) {
    return Promise.resolve(`${prefix}${semi}${suffix}`);
  }
  return await leet(`${prefix}${semi}${suffix}`);
}

export async function generateRandomName(type: "chuunibyou" | "hacker") {
  switch (type) {
    case "chuunibyou":
      return generate(chuunibyou);
    case "hacker":
      return generate(hacker);
  }
}
