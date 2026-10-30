import kisoCss from 'kiso.css/kiso.css?raw';
import colorTokens from '../demos/tokens/colors.css?raw';
import shadowTokens from '../demos/tokens/shadows.css?raw';
import sizeTokens from '../demos/tokens/sizes.css?raw';
import motionTokens from '../demos/tokens/motion.css?raw';
import typographyTokens from '../demos/tokens/typography.css?raw';
import zIndexTokens from '../demos/tokens/z-index.css?raw';

/**
 * デモの土台。
 * - `kiso`: 本書が推奨する環境（レイヤーの順序宣言、`tokens` レイヤーに入れた共通トークン、`reset` レイヤーに入れた kiso.css、ベーススタイル）
 * - `none`: ブラウザのデフォルトスタイルのまま
 */
export type DemoBase = 'kiso' | 'none';

/**
 * デモの配色。
 * - `auto`: 本のページのテーマ（ライトとダーク）に追従する
 * - `light` / `dark`: どちらかに固定する。特定の色を見せるデモに使う
 * - `light dark`: OS の設定に従う。`prefers-color-scheme` を説明するデモに使う
 */
export type DemoScheme = 'auto' | 'light' | 'dark' | 'light dark';

/**
 * `auto` のデモで、本のページの `data-theme`（Starlight が解決したライトかダーク）を iframe のルートの `color-scheme` に写す。
 * 描画より前に走らせるため、`<head>` の同期スクリプトにする。srcdoc の iframe は親と同じオリジンなので、親の DOM を読める。
 */
const THEME_SYNC = `(() => {
  let parentRoot = null;
  try {
    parentRoot = window.parent !== window ? window.parent.document.documentElement : null;
  } catch {}
  if (!parentRoot) return;
  const root = document.documentElement;
  const sync = () => {
    root.style.colorScheme = parentRoot.dataset.theme === 'dark' ? 'dark' : 'light';
  };
  sync();
  new MutationObserver(sync).observe(parentRoot, { attributes: true, attributeFilter: ['data-theme'] });
})();`;

const LAYER_ORDER =
  '@layer tokens, reset, base, vendors, compositions, pages, components, patterns, utilities;';

/** すべてのデモが使う共通トークン。`src/demos/tokens/` に分類ごとに置いている。 */
const TOKENS = [
  colorTokens,
  shadowTokens,
  sizeTokens,
  typographyTokens,
  motionTokens,
  zIndexTokens,
].join('\n');

/**
 * デモのベーススタイル。
 * 全称セレクタの `min-inline-size: 0` は、8-2 のベーススタイルと同じ指定で、本書の列を `1fr` のまま書く前提になる。
 * kiso.css は `body` に `min-block-size: 100dvb` を指定しているが、そのままだと
 * iframe の高さを中身に合わせられないため、デモでは解除する。
 * テーマに追従させるため、背景と文字の色は `body` にセマンティクスのトークンで指定する。
 */
const DEMO_BASE = `@layer base {
  *,
  ::before,
  ::after {
    min-inline-size: 0;
  }

  body {
    min-block-size: initial;
    padding: 24px;
    background-color: var(--background--base);
    color: var(--foreground--base);
  }
}`;

/**
 * デモを見せるための足場（本文の主題ではないもの）。デモの CSS のタブと AI 向けの配布物には出さない。
 * - `body[data-demo-bleed]`: `<Demo bleed>` で付く。デモの枠の余白を外し、要素を枠の端まで届かせる（`inline` は左右だけ）
 * - `[data-demo-layout="compare"]`: 比べる区画を横に並べ、狭ければ縦に積む。各区画の先頭の見出しは、ラベルの大きさにする。区画がコンポーネントのルート（`.scoped`）なら、その中には手を出さない
 * - `[data-demo-layout="stack"]`: 区画の幅が結果を左右するデモで、区画をいつも縦に積む。ほかは `compare` と同じ
 * 足場の説明は、付録I「デモの共通トークン」に書く。
 */
const DEMO_FRAME = `@layer base {
  body {
    &[data-demo-bleed="all"] {
      padding: unset;
    }

    &[data-demo-bleed="inline"] {
      padding-inline: unset;
    }
  }
}

@layer compositions {
  :is([data-demo-layout="compare"], [data-demo-layout="stack"]) {
    display: block grid;
    gap: 16px;

    /* 直下の子がコンポーネントのルートなら、その中の配置と見出しはコンポーネントに任せる */
    & > :not(.scoped) {
      display: block grid;
      gap: 8px;
      align-content: start;
    }

    & > :not(.scoped) > :is(h2, h3, h4):first-child {
      font-size: calc(var(--text--body-compact--font-size) / 16 * 1rem);
      line-height: var(--text--body-compact--leading);
    }
  }

  [data-demo-layout="compare"] {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(240 / 16 * 1rem)), 1fr));
  }
}`;

/** `<Demo bleed>` の値。`all` は上下左右、`inline` は左右だけの余白を外す。 */
export type DemoBleed = 'all' | 'inline';

export const buildSrcdoc = ({
  html,
  css,
  base = 'kiso',
  scheme = 'auto',
  js,
  frame,
  bleed,
}: {
  html: string;
  css: string;
  base?: DemoBase;
  scheme?: DemoScheme;
  /** デモを動かすためのスクリプト。本文の主題ではないので、コードのタブには出さない。 */
  js?: string;
  /** デモを見せるための足場の CSS（`frame.css`）。本文の主題ではないので、コードのタブには出さない。`style.css` より前に読み込む。 */
  frame?: string;
  bleed?: DemoBleed;
}) => {
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="color-scheme" content="${scheme === 'auto' ? 'light dark' : scheme}">`,
  ];
  if (scheme === 'auto') head.push(`<script>${THEME_SYNC}</script>`);
  if (base === 'kiso') {
    head.push(
      `<style>${LAYER_ORDER}</style>`,
      `<style>@layer tokens {\n${TOKENS}\n}</style>`,
      `<style>@layer reset {\n${kisoCss}\n}</style>`,
      `<style>${DEMO_BASE}</style>`,
      `<style>${DEMO_FRAME}</style>`,
    );
  }
  if (frame) head.push(`<style>\n${frame}\n</style>`);
  head.push(`<style>\n${css}\n</style>`);
  const script = js ? `<script type="module">\n${js}\n</script>` : '';
  const body = bleed ? `<body data-demo-bleed="${bleed}">` : '<body>';
  return `<!doctype html><html lang="ja"><head>${head.join('')}</head>${body}\n${html}\n${script}</body></html>`;
};
