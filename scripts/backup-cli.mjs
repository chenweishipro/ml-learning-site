// CLI 备份: node scripts/backup-cli.mjs
import { runDailyBackup } from "../lib/scripts/backup.js";

const result = await runDailyBackup({
  retention: 30,
  uploadToS3: !!process.env.S3_BUCKET,
});

if (result.ok) {
  console.log(`✅ Backup OK: ${result.path} (${result.size} bytes)`);
  process.exit(0);
} else {
  console.error(`❌ Backup failed: ${result.error}`);
  process.exit(1);
}
