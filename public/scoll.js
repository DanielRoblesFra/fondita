(function() {
    let isScrolling; // variable para controlar scroll

    window.addEventListener('scroll', function() {
        window.clearTimeout(isScrolling);

        // Cada vez que haya scroll, se ejecuta esto
        isScrolling = setTimeout(function() {
            // Opcional: aquí puedes ejecutar algo cuando el scroll se detenga
        }, 66);
    }, false);
})();