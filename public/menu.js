// Seleccionamos elementos
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Función para alternar menú
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        // Remueve la clase 'active' del menú y del icono
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});
