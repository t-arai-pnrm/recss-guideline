const root = document.querySelector('.scoped.comparison-slider');
const range = root.querySelector('input[type="range"]');

const update = () => {
  root.style.setProperty('--comparison-slider--position', `${range.value}%`);
};

range.addEventListener('input', update);

// 再読み込みでブラウザが入力の値を復元した場合にも合わせる
update();
