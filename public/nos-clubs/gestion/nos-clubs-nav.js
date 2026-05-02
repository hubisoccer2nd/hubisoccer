// nos-clubs-nav.js – Garde l'ID du club dans tous les liens de navigation
(function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    document.querySelectorAll('a[data-nav-link]').forEach(link => {
        const basePage = link.getAttribute('data-nav-link');
        if (basePage) {
            link.href = basePage + '?id=' + id;
        }
    });
})();
