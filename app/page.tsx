import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { CoursePreview } from "@/components/home/CoursePreview";
import { Stats } from "@/components/home/Stats";
import { CTA } from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <CoursePreview />
      <Stats />
      <CTA />
    </>
  );
}
