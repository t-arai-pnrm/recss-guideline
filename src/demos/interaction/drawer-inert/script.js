const button = document.querySelector('.global-header ._drawer-button');
const drawer = document.querySelector('.global-header ._drawer');
const background = document.querySelectorAll('body > :not(.global-header)');

// 開閉に合わせて aria-expanded と hidden を切り替え、ヘッダー以外の要素に inert を付け外しする
const setExpanded = (expanded) => {
  button.setAttribute('aria-expanded', String(expanded));
  drawer.hidden = !expanded;
  for (const element of background) element.inert = expanded;
};

// 開閉の処理が動く状態になってから、ドロワーを隠してボタンを出す
const initializeDrawer = () => {
  if (!button || !drawer) return;
  button.setAttribute('aria-controls', drawer.id);
  setExpanded(false);
  button.hidden = false;

  button.addEventListener('click', () => {
    setExpanded(button.getAttribute('aria-expanded') !== 'true');
  });

  // 背面を操作できない間は実質的にモーダルなので、ダイアログと同じく Esc キーで閉じ、ボタンへフォーカスを戻す
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    setExpanded(false);
    button.focus();
  });
};

initializeDrawer();
