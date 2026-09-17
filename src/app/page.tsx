import { PortfolioExperience } from "@/components/PortfolioExperience";
import { loadPortfolioData } from "@/lib/data/projects";

// 관리자 페이지에서 프로젝트를 추가하면 새로고침 시 반영되도록 캐시를 두지 않는다.
export const dynamic = "force-dynamic";

/** RPD 7장 — 별도의 Landing Page 없이 접속 즉시 도서관 중앙에서 시작한다. */
export default async function Home() {
  const { projects, about, usingSampleData } = await loadPortfolioData();

  return (
    <main>
      <PortfolioExperience projects={projects} about={about} usingSampleData={usingSampleData} />
    </main>
  );
}
