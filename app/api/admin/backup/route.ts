// 手动触发备份 (admin only)
// GET /api/admin/backup?retention=30
import { runDailyBackup } from "@/lib/scripts/backup";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { isAdmin } from "@/lib/roles";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return fail("需要管理员权限", 403);
  }
  const url = new URL(req.url);
  const retention = Number(url.searchParams.get("retention") ?? "30");
  const uploadToS3 = url.searchParams.get("s3") === "1";

  const result = await runDailyBackup({
    retention,
    uploadToS3,
  });
  if (!result.ok) return fail(result.error ?? "备份失败", 500);
  return ok(result);
}
