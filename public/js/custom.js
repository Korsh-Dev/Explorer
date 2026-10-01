$(document).ready(function() {
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#85988F';
    Chart.defaults.borderColor = 'rgba(0, 204, 82, 0.12)';
    if (Chart.defaults.font) {
      Chart.defaults.font.family = "'Exo 2', -apple-system, BlinkMacSystemFont, sans-serif";
    }
  }

  // Universal clipboard copy handler
  $(document).on('click', '.btn-copy, [data-copy]', function(e) {
    e.preventDefault();
    const $btn = $(this);
    let text = $btn.attr('data-copy');
    
    if (!text || text.length === 0) {
      text = $btn.siblings('.mono').text() || $btn.closest('.card-header').find('.mono').text();
    }

    if (text) {
      const copyVal = text.trim();
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyVal).then(showSuccess).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        const temp = $('<textarea>');
        $('body').append(temp);
        temp.val(copyVal).select();
        document.execCommand('copy');
        temp.remove();
        showSuccess();
      }

      function showSuccess() {
        const originalHtml = $btn.html();
        $btn.html('<i class="fa-solid fa-check" style="color: var(--korsh-neon);"></i>');
        $btn.addClass('btn-copy-success');
        setTimeout(function() {
          $btn.html(originalHtml);
          $btn.removeClass('btn-copy-success');
        }, 1600);
      }
    }
  });
});