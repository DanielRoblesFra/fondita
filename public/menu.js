// menu.js - VERSIÓN MEJORADA
// Seleccionamos elementos
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Función para alternar menú
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Función para cerrar el menú
function cerrarMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Prevenir comportamiento por defecto para manejar manualmente
        e.preventDefault();
        
        // Obtener el destino del enlace
        const targetId = link.getAttribute('href');
        
        // Cerrar el menú inmediatamente
        cerrarMenu();
        
        // Esperar un poco para que el menú se cierre visualmente
        setTimeout(() => {
            // Navegar a la sección
            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Scroll suave a la sección
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } else {
                // Si es un enlace externo, navegar normalmente
                window.location.href = targetId;
            }
        }, 300); // 300ms de delay para la animación
    });
});

// Cerrar menú al hacer clic fuera de él
document.addEventListener('click', (e) => {
    const isClickInsideMenu = navMenu.contains(e.target);
    const isClickOnHamburger = hamburger.contains(e.target);
    
    if (!isClickInsideMenu && !isClickOnHamburger && navMenu.classList.contains('active')) {
        cerrarMenu();
    }
});

// Cerrar menú al redimensionar la ventana (si se cambia a desktop)
window.addEventListener('resize', () => {
    if (window.innerWidth > 767 && navMenu.classList.contains('active')) {
        cerrarMenu();
    }
});

// Cerrar menú al hacer scroll (opcional)
window.addEventListener('scroll', () => {
    if (navMenu.classList.contains('active')) {
        cerrarMenu();
    }
});
