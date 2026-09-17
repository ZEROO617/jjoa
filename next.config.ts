import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Supabase Storage 공개 버킷의 대표 이미지를 next/image로 최적화하기 위한 허용 호스트
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // three.js는 ESM 전용 예제 모듈을 포함하므로 트랜스파일 대상에 포함한다.
  transpilePackages: ["three"],
};

export default nextConfig;
