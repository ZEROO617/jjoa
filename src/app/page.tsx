import { PortfolioExperience } from "@/components/PortfolioExperience";

/**
 * RPD 7장 — 별도의 Landing Page 없이 접속 즉시 도서관 중앙에서 시작한다.
 *
 * 프로젝트 데이터는 PortfolioExperience 안에서 브라우저가 직접 조회한다.
 * 덕분에 이 페이지는 완전히 정적이며, Node 서버와 GitHub Pages 양쪽에서
 * 같은 코드로 동작한다.
 */
export default function Home() {
  return (
    <main>
      <PortfolioExperience />
    </main>
  );
}
