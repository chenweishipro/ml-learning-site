// 构建 FTS5 全文搜索索引 (一次性/部署时)
import { ensureFtsIndex, clearFulltextCache } from "../lib/fulltext-search";

async function main() {
  console.log("🔨 Building FTS5 index...");
  await clearFulltextCache();
  await ensureFtsIndex(true);
  console.log("✅ FTS5 index built successfully");
  process.exit(0);
}

main().catch((e) => {
  console.error("Build failed:", e);
  process.exit(1);
});
