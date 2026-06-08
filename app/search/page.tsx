import type { Metadata } from "next";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "搜索",
  description: "在所有课程中搜索关键字。",
};

export default function SearchPage() {
  return <SearchClient />;
}
