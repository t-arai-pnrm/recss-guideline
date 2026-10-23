const button = document.querySelector('.global-header ._drawer-button');
const drawer = document.querySelector('.global-header ._drawer');
const background = document.querySelectorAll('body > :not(.global-header)');

// 開閉の処理が動く状態になってから、ドロワーを隠してボタンを出す
const initializeDrawer = () => {
  if (!button || !drawer) return;
  button.setAttribute('aria-controls', drawer.id);
  button.setAttribute('aria-expanded', 'false');
  drawer.hidden = true;
  button.hidden = false;

  // 開閉に合わせて aria-expanded と hidden を切り替え、ヘッダー以外の要素に inert を付け外しする
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    drawer.hidden = !expanded;
    for (const element of background) element.inert = expanded;
  });
};

initializeDrawer();
