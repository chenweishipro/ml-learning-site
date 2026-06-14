import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findSimilarUsers } from "@/lib/people";
import { PeopleList } from "./PeopleList";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = { title: "学习圈 · ML 学习站" };

export default async function PeoplePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/");
  const users = await findSimilarUsers(user.id, 16);
  return <PeopleList users={users as any} myId={user.id} />;
}
