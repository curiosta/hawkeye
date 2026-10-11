(function () {
  var b = document.querySelector('.nav-toggle'), n = document.getElementById('site-nav');
  if (!b || !n) return;
  b.addEventListener('click', function () {
    var open = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!open));
    n.classList.toggle('open', !open);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && n.classList.contains('open')) {
      b.setAttribute('aria-expanded', 'false'); n.classList.remove('open'); b.focus();
    }
  });
})();
