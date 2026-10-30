// ボタンを押しても開けるように、初期化に成功してから開閉の状態を付ける
const triggers = document.querySelectorAll('.scoped.action-menu ._trigger');

for (const trigger of triggers) {
  trigger.setAttribute('aria-expanded', 'false');

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    for (const other of triggers) other.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-expanded', String(!expanded));
  });
}

// 三角形の矩形は、カーソルの位置からサブメニューの左の辺まで。高さはサブメニューにそろえる
for (const trigger of document.querySelectorAll('.scoped.action-menu[data-safe-triangle] ._trigger')) {
  const submenu = trigger.nextElementSibling;

  trigger.addEventListener('pointermove', (event) => {
    const rect = submenu.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    trigger.style.setProperty('--_safe-top', `${rect.top}px`);
    trigger.style.setProperty('--_safe-right', `${clientWidth - rect.left}px`);
    trigger.style.setProperty('--_safe-bottom', `${clientHeight - rect.bottom}px`);
    trigger.style.setProperty('--_safe-left', `${event.clientX}px`);
    trigger.style.setProperty('--_safe-y', `${event.clientY - rect.top}px`);
  });
}
