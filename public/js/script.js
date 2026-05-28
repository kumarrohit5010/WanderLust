// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict';

  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      'submit',
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add('was-validated');
      },
      false
    );
  });

  const flashMessages = document.querySelectorAll('[data-flash-message]');
  flashMessages.forEach((message, index) => {
    window.setTimeout(() => {
      message.classList.add('is-hiding');
      window.setTimeout(() => message.remove(), 320);
    }, 3800 + index * 250);
  });

  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const syncBackToTop = () => {
      if (window.scrollY > 320) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    };

    syncBackToTop();
    window.addEventListener('scroll', syncBackToTop, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();