const button = document.querySelector('.mega-header ._menu-button');
const item = button.parentElement;

const setExpanded = (expanded) => button.setAttribute('aria-expanded', String(expanded));

// 初期の HTML ではボタンを隠し、パネルのリンクを通常の流れに並べておく。
// 初期化できたら、ボタンを出して aria-expanded を付け、CSS がパネルを重ねて隠す
setExpanded(false);
button.hidden = false;

button.addEventListener('click', () => {
  setExpanded(button.getAttribute('aria-expanded') !== 'true');
});

// Esc キーで閉じ、フォーカスをボタンに戻す
item.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
  setExpanded(false);
  button.focus();
});

// ボタンとパネルの外へフォーカスが移るか、外を押したら閉じる
item.addEventListener('focusout', (event) => {
  if (event.relatedTarget && !item.contains(event.relatedTarget)) setExpanded(false);
});

document.addEventListener('pointerdown', (event) => {
  if (!item.contains(event.target)) setExpanded(false);
});
