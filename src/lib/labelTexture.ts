import { CanvasTexture, SRGBColorSpace } from "three";

export interface LabelOptions {
  /** 위에서부터 차례로 그릴 줄 */
  lines: string[];
  /** 캔버스 픽셀 크기. 대상 면의 가로세로 비율과 맞춰야 글자가 늘어나지 않는다. */
  width: number;
  height: number;
  background: string;
  color: string;
  /** 기준 글자 크기(px). 폭에 맞지 않으면 자동으로 줄인다. */
  fontSize: number;
  fontWeight?: string;
  letterSpacing?: number;
  /** 제목 위아래 장식선 */
  rules?: boolean;
  padding?: number;
}

/** 캔버스 2D 폰트 스택. 한글 프로젝트명도 표시되도록 산세리프 폴백을 둔다. */
const FONT_STACK =
  'Georgia, "Times New Roman", "Apple SD Gothic Neo", "Malgun Gothic", serif';

/**
 * 책등·명패용 라벨 텍스처.
 *
 * troika(@react-three/drei의 <Text>)를 쓰지 않는 이유:
 * - 폰트가 준비될 때까지 React를 suspend하고, 글리프 SDF를 별도 WebGL 컨텍스트와
 *   워커에서 생성한다. 그 과정이 끝나지 않으면 글자가 조용히 사라진다(실제로 겪음).
 * - font를 지정하지 않으면 외부 CDN에서 폰트를 받아온다.
 * 책등 제목은 짧고 평면에 고정된 정적 텍스트이므로, 캔버스 텍스처면 충분하고
 * 외부 의존성·워커·서스펜스가 전혀 없다. 한글도 시스템 폰트로 바로 렌더된다.
 */
export function createLabelTexture(options: LabelOptions): CanvasTexture {
  const {
    lines,
    width,
    height,
    background,
    color,
    fontSize,
    fontWeight = "600",
    letterSpacing = 0,
    rules = false,
    padding = Math.round(width * 0.12),
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const usable = width - padding * 2;
  const rows = lines.filter((line) => line.length > 0);

  // 가장 긴 줄이 폭에 들어오도록 글자 크기를 줄인다.
  let size = fontSize;
  const measure = (text: string, fs: number) => {
    ctx.font = `${fontWeight} ${fs}px ${FONT_STACK}`;
    return ctx.measureText(text).width + letterSpacing * Math.max(0, text.length - 1);
  };
  while (size > 6 && rows.some((line) => measure(line, size) > usable)) size -= 1;

  ctx.font = `${fontWeight} ${size}px ${FONT_STACK}`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const lineHeight = size * 1.24;
  const blockHeight = rows.length * lineHeight;
  // 책등은 위쪽에 제목을 두는 편이 실제 책과 가깝다.
  const startY = rules ? Math.max(blockHeight / 2 + size, height * 0.26) : height / 2 - blockHeight / 2 + lineHeight / 2;

  rows.forEach((line, i) => {
    const y = startY + i * lineHeight;
    const lineWidth = measure(line, size);
    let x = (width - lineWidth) / 2;
    ctx.font = `${fontWeight} ${size}px ${FONT_STACK}`;

    // letterSpacing은 브라우저 지원이 고르지 않아 글자 단위로 직접 배치한다.
    for (const char of line) {
      ctx.fillText(char, x, y);
      x += ctx.measureText(char).width + letterSpacing;
    }
  });

  if (rules && rows.length > 0) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = color;
    const ruleWidth = usable * 0.62;
    const ruleX = (width - ruleWidth) / 2;
    ctx.fillRect(ruleX, startY - size * 1.1, ruleWidth, Math.max(1, Math.round(width / 96)));
    ctx.fillRect(
      ruleX,
      startY + (rows.length - 1) * lineHeight + size * 0.95,
      ruleWidth,
      Math.max(1, Math.round(width / 96)),
    );
    ctx.globalAlpha = 1;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** "LOGIS\nFINDER" 처럼 실제 줄바꿈과 리터럴 \n 을 모두 줄 배열로 만든다. */
export function toLines(value: string): string[] {
  return value
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
