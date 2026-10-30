/**
 * デモの CSS が、共通トークン（`src/demos/tokens/`）の使い方の約束に沿っているかを調べる。
 * - 共通トークンを宣言し直していないか
 * - 色のプリミティブ（`--color--*`）を直接参照していないか
 * - `font-size` と `line-height` を、役割のトークンを使わずに値で書いていないか
 * - `--background--hover`／`--background--active` を、状態のない面に使っていないか
 *
 * 使い方: node scripts/lint-demos.mjs [ファイル…]
 * 引数がなければ、`src/demos/` の `style.css` をすべて調べる。
 * `style.bad.css`（Not Recommended）と `frame.css`（見せるための足場）は対象外。
 * 例外は、付録I「デモの見た目の約束」の一覧と、下の `EXCEPTIONS` をそろえる。
 */
import { readFile, readdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

// postcss は Stylelint の依存として入っているので、Stylelint の実体の場所から読み込む
const require = createRequire(join(realpathSync('node_modules/stylelint'), 'package.json'));
const postcss = require('postcss');

const ROOT = process.cwd();
const DEMOS = join(ROOT, 'src/demos');
const TOKENS = join(DEMOS, 'tokens');

/**
 * デモのディレクトリ（`src/demos/` からのパス）ごとに、外す検査の名前を並べる。
 * - `redeclare`：本文の構成をそのまま再現するデモ（値は共通トークンにそろえる）
 * - `type-scale`：文字の大きさや行の高さそのものを比べるデモ
 * - `primitive`：色そのものを見せるデモ（`<Demo scheme="light">` で固定したもの）と、本文の構成を再現するデモ
 * - `state-surface`：状態のフラグで隠した擬似要素に、ホバーの色を置くデモ
 */
const EXCEPTIONS = {
  // 本文の構成をそのまま再現するデモ。カードの面と muted の文字色は、灰色の背景の上で境界とコントラストを保つ値にしている
  'introduction/quick-start': ['redeclare', 'primitive', 'type-scale'],
  // テーマのトークンを定義する書き方そのものを見せるデモ
  'color-media/theme-switch': ['redeclare', 'primitive'],
  'color-media/theme-tokens': ['redeclare', 'primitive'],
  'components/theme-toggle-shadow': ['redeclare', 'primitive'],
  // 文字の大きさや行の高さそのものを比べるデモ
  'pseudo/first-letter-line': ['type-scale'],
  'pseudo/marker-props': ['type-scale'],
  'values/lh-icon': ['type-scale'],
  'values/svi-and-cqi': ['type-scale'],
  'values/text-scaling': ['type-scale'],
  'responsive/fluid-between-card': ['type-scale'],
  'responsive/root-cqi-card': ['type-scale'],
  'responsive/hero-cqi': ['type-scale'],
  // 図の大きさに比例させる、図の中の数値
  'decoration/donut-chart': ['type-scale'],
  // ホバーした項目へ動く印の擬似要素。印は `--_has-hocus` が `--false` の間は隠れている
  'layout-practice/hover-indicator': ['state-surface'],
  // 下書きの「CMSの本文エリアをスタイリングする」のデモ。CMS の節を書き上げるときに直す
  'operations/content-flow': ['type-scale'],
  // iOS の拡大を防ぐ `max(16px, 1rem)` の下限を見せるデモ（ルール `font-size-in-rem` の例外）
  'values/textarea-rows': ['type-scale'],
};

/** 状態のセレクタや条件と見なす語（祖先のセレクタと条件に1つでもあれば、状態の面とする） */
const STATE_PATTERN = /:hover|:active|:focus|:checked|:open|:popover-open|:target|:user-invalid|aria-(pressed|selected|expanded|current|checked)|--_hocus|--_has-|--_pressed|--_selected|--_open|\[open\]|data-state/;

const listFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name === 'style.css')
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => !file.startsWith(TOKENS));
};

const tokenNames = async () => {
  const names = new Set();
  for (const entry of await readdir(TOKENS)) {
    if (!entry.endsWith('.css')) continue;
    const css = await readFile(join(TOKENS, entry), 'utf8');
    for (const match of css.matchAll(/^\s*(--[\w-]+)\s*:/gm)) names.add(match[1]);
  }
  return names;
};

/** 祖先のセレクタと条件をつないだ文字列 */
const context = (node) => {
  const parts = [];
  for (let parent = node.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    parts.push(parent.type === 'rule' ? parent.selector : `@${parent.name} ${parent.params}`);
  }
  return parts.join(' ');
};

const usesNumber = (value) => /\d/.test(value.replace(/var\([^)]*\)/g, ''));

const check = (css, file, tokens) => {
  const demo = relative(DEMOS, join(file, '..'));
  const skip = new Set(EXCEPTIONS[demo] ?? []);
  const problems = [];
  const report = (decl, kind, message) => {
    if (!skip.has(kind)) problems.push({ line: decl.source.start.line, kind, message });
  };
  postcss.parse(css).walkDecls((decl) => {
    const { prop, value } = decl;
    if (tokens.has(prop)) report(decl, 'redeclare', `共通トークン ${prop} を宣言し直している`);
    if (/var\(--color--/.test(value)) report(decl, 'primitive', `色のプリミティブを直接参照している（${value}）`);
    if ((prop === 'font-size' || prop === 'line-height') && !/var\(--(text--|_|[a-z][\w-]*--)/.test(value) && usesNumber(value)) {
      report(decl, 'type-scale', `${prop} を役割のトークンを使わずに書いている（${value}）`);
    }
    // 状態の接尾辞を付けた内部プロパティ（`--_background--hocus` など）に入れる値も、状態の面と見なす
    const stateProp = /^--_[\w-]*--(hocus|hover|active|pressed|selected|open|current)$/.test(prop);
    if (/var\(--background--(hover|active)\)/.test(value) && !stateProp && !STATE_PATTERN.test(`${decl.parent.selector ?? ''} ${context(decl)}`)) {
      report(decl, 'state-surface', `状態のない面に ${value} を使っている`);
    }
  });
  return problems;
};

const files = process.argv.length > 2 ? process.argv.slice(2).map((file) => join(ROOT, file)) : await listFiles(DEMOS);
const tokens = await tokenNames();
let count = 0;
for (const file of files.sort()) {
  const problems = check(await readFile(file, 'utf8'), file, tokens);
  for (const { line, kind, message } of problems) {
    console.log(`${relative(ROOT, file)}:${line}  ${message}  [${kind}]`);
  }
  count += problems.length;
}
if (count > 0) {
  console.log(`\n${count}件`);
  process.exitCode = 1;
}
