import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/public-profile";
import { TIER_META } from "@/lib/badges";
import { cn } from "@/lib/utils";
import {
  Award, BookOpen, Trophy, Clock, MessageSquare, FileText,
  Calendar, GraduationCap, Sparkles, UserPlus, UserCheck, Link2, ArrowLeft, ShieldCheck,
} from "lucide-react";
import { FollowButton } from "./FollowButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const profile = await getPublicProfile(params.id);
  if (!profile) return { title: "用户不存在 · ML 学习站" };
  return {
    title: `${profile.displayName} · ML 学习站`,
    description: profile.bio || `${profile.displayName} 的公开学习主页`,
  };
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const profile = await getPublicProfile(params.id);
  if (!profile) notFound();

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/courses/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
        <ArrowLeft className="h-3.5 w-3.5" /> 课程
      </Link>

      {/* 头部: 头像 + 名字 + bio + 关注 */}
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar url={profile.avatarUrl} name={profile.displayName} size={80} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
              {profile.role === "superadmin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50">
                  <ShieldCheck className="h-3 w-3" /> 超管
                </span>
              )}
              {profile.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50">
                  <ShieldCheck className="h-3 w-3" /> 管理员
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{profile.bio}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 加入 {new Date(profile.joinedAt).toLocaleDateString("zh-CN")}
              </span>
              <span>·</span>
              <span>{profile.followersCount} 关注者</span>
              <span>·</span>
              <span>关注 {profile.followingCount}</span>
            </div>
          </div>
          <FollowButton userId={profile.id} />
        </div>
      </header>

      {/* 8 维统计 */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<BookOpen className="h-4 w-4" />} label="完成章节" value={profile.stats.chaptersCompleted} />
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="完成课程" value={profile.stats.coursesCompleted} accent />
        <Stat icon={<Trophy className="h-4 w-4" />} label="已获勋章" value={profile.stats.badgesCount} accent />
        <Stat icon={<Clock className="h-4 w-4" />} label="累计学习" value={`${profile.stats.totalHours.toFixed(1)}h`} />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="评论" value={profile.stats.commentsCount} />
        <Stat icon={<FileText className="h-4 w-4" />} label="笔记" value={profile.stats.notesCount} />
        <Stat icon={<Calendar className="h-4 w-4" />} label="连续天数" value={profile.stats.consecutiveDays} />
        <Stat icon={<Award className="h-4 w-4" />} label="证书" value={profile.stats.certificatesCount} />
      </section>

      {/* 徽章墙 */}
      {profile.badges.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Award className="h-4 w-4 text-amber-500" /> 徽章 ({profile.badges.length})
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {profile.badges.map((b) => {
              const m = TIER_META[b.tier];
              return (
                <div key={b.id} className={cn("rounded-xl border border-transparent p-3 text-center ring-1", m.bg, m.ring)}>
                  <div className="text-3xl">{b.emoji}</div>
                  <div className="mt-1 text-[10px] font-medium">{b.name}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 证书 */}
      {profile.certificates.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="h-4 w-4 text-primary-600" /> 证书 ({profile.certificates.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.certificates.map((c) => (
              <Link
                key={c.serialNo}
                href={`/certificates/${c.serialNo}/`}
                className="rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="text-sm font-medium">{c.courseTitle}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                  <span>编号 {c.serialNo.slice(0, 12)}...</span>
                  <span>·</span>
                  <span>{new Date(c.issuedAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 已学完课程 */}
      {profile.completedCourses.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-4 w-4 text-primary-600" /> 已学完课程 ({profile.completedCourses.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.completedCourses.slice(0, 6).map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}/`}
                className="rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.title}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {Math.round(c.progress * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className="h-full bg-emerald-500" style={{ width: `${c.progress * 100}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 最近评论 */}
      {profile.recentComments.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-4 w-4 text-primary-600" /> 最近评论 ({profile.recentComments.length})
          </h2>
          <div className="space-y-2">
            {profile.recentComments.map((c) => (
              <div key={c.id} className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">{c.body}</p>
                <div className="mt-1 text-[10px] text-neutral-500">
                  {c.chapterSlug ? (
                    <Link href={`/courses/${c.courseSlug}/${c.chapterSlug}/`} className="hover:underline">
                      {c.courseSlug} / {c.chapterSlug}
                    </Link>
                  ) : (
                    <Link href={`/courses/${c.courseSlug}/`} className="hover:underline">
                      {c.courseSlug}
                    </Link>
                  )}
                  <span className="ml-1.5">· {new Date(c.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.badges.length === 0 && profile.certificates.length === 0 && profile.completedCourses.length === 0 && profile.recentComments.length === 0 && (
        <section className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-neutral-400" />
          该用户还没有公开的学习记录
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", accent ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900")}>
      <div className="flex items-center gap-1.5 text-neutral-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn("mt-1 text-xl font-bold tabular-nums", accent && "text-amber-600 dark:text-amber-300")}>
        {value}
      </div>
    </div>
  );
}

function Avatar({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return <img src={url} alt={name} className="rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700" style={{ width: size, height: size }} />;
  }
  const initial = (name || "?")[0].toUpperCase();
  // 渐变背景基于名字
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="grid place-items-center rounded-full font-bold text-white ring-2 ring-neutral-200 dark:ring-neutral-700"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},70%,45%))`,
      }}
    >
      {initial}
    </div>
  );
}
