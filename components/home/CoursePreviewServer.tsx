import { getAllCoursesWithOverrides } from "@/lib/content-overrides";
import { CoursePreview } from "./CoursePreview";

/** Server wrapper: 拉取含 DB override 的课程列表后传给客户端组件 */
export async function CoursePreviewServer() {
  const courses = await getAllCoursesWithOverrides();
  return <CoursePreview courses={courses} />;
}
