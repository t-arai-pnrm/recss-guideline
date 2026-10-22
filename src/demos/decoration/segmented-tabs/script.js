const tabs = [...document.querySelectorAll('.scoped.segmented-tabs ._tab')];

// 選んだタブに aria-selected="true" を付け、対応するパネルだけを表示する
const select = (selected) => {
  for (const tab of tabs) {
    const isSelected = tab === selected;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !isSelected;
  }
};

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => select(tab));

  // 左右の矢印キーで見た目の隣のタブに、Home と End で端のタブに移る。右から左へ書く言語では、左の矢印キーが次のタブになる
  tab.addEventListener('keydown', (event) => {
    const step = getComputedStyle(tab).direction === 'rtl' ? -1 : 1;
    const next = {
      ArrowRight: tabs[(index + step + tabs.length) % tabs.length],
      ArrowLeft: tabs[(index - step + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs.at(-1),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    select(next);
    next.focus();
  });
}
