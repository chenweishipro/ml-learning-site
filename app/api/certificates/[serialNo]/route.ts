// 证书查询 API
import { prisma } from "@/lib/db";
import { getAllCoursesSync } from "@/lib/content-overrides";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { serialNo: string } }
) {
  const cert = await prisma.certificate.findUnique({
    where: { serialNo: params.serialNo },
    include: {
      user: {
        select: { email: true, displayName: true },
      },
    },
  });
  if (!cert) return fail("证书不存在", 404);

  const allCourses = getAllCoursesSync();
  const course = allCourses.find((c: any) => c.slug === cert.courseSlug);

  return ok({
    certificate: {
      id: cert.id,
      serialNo: cert.serialNo,
      courseSlug: cert.courseSlug,
      courseTitle: course?.title ?? cert.courseSlug,
      issuedAt: cert.issuedAt.toISOString(),
      finalScore: cert.finalScore,
      user: {
        email: cert.user.email,
        displayName: cert.user.displayName,
      },
    },
  });
}
