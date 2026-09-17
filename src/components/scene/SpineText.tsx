"use client";

import { Text } from "@react-three/drei";
import { Suspense, type ComponentProps } from "react";

/**
 * 자체 호스팅 폰트(EB Garamond, Latin 서브셋 27KB).
 *
 * 중요: drei의 <Text>는 폰트가 준비될 때까지 React를 suspend한다.
 * font 프롭을 주지 않으면 troika가 jsdelivr CDN(unicode-font-resolver)에서
 * 폰트를 받아오는데, 그 요청이 느리거나 차단되면 도서관 전체가 로딩 화면에서
 * 멈춘다. 그래서 (1) 폰트를 직접 호스팅하고 (2) 텍스트마다 Suspense 경계를
 * 따로 두어, 폰트 문제가 씬 렌더링을 막지 못하게 한다.
 */
export const SPINE_FONT = "/fonts/spine-latin.ttf";

export function SpineText({ children, ...props }: ComponentProps<typeof Text>) {
  return (
    <Suspense fallback={null}>
      <Text font={SPINE_FONT} {...props}>
        {children}
      </Text>
    </Suspense>
  );
}
