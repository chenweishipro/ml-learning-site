import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileEditor } from "./ProfileEditor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = { title: "编辑个人资料 · ML 学习站" };

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/");

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, displayName: true, bio: true, avatarUrl: true, profilePublic: true, email: true, role: true },
  });
  if (!full) redirect("/login/");

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">编辑个人资料</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        这些信息会显示在你的 <a href={`/u/${full.id}/`} className="text-primary-700 hover:underline dark:text-primary-300">公开主页</a> 上
      </p>
      <ProfileEditor
        initial={{
          id: full.id,
          email: full.email,
          displayName: full.displayName ?? "",
          bio: full.bio ?? "",
          avatarUrl: full.avatarUrl ?? "",
          profilePublic: (full.profilePublic ?? 1) as 0 | 1,
          role: full.role,
        }}
      />
    </div>
  );
}
