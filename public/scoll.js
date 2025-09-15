// scoll.js - Scroll suave universal para móvil y PC
document.addEventListener('DOMContentLoaded', function() {
    // Función de scroll suave mejorada
    function smoothScroll(target) {
        // Obtener el elemento destino
        const targetElement = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
        
        if (!targetElement) return;

        // Calcular posición destino
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800; // ms
        let startTime = null;

        // Función de easing (suavizado)
        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        // Función de animación
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + (distance * easeProgress));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        // Iniciar animación
        requestAnimationFrame(animation);
    }

    // Aplicar scroll suave a todos los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if (target !== '#') {
                smoothScroll(target);
            }
        });
    });

    // También aplicar a elementos con clase .smooth-scroll
    document.querySelectorAll('.smooth-scroll').forEach(element => {
        element.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            if (target) {
                smoothScroll(target);
            }
        });
    });

    console.log('✅ Scroll suave activado para todos los dispositivos');
});

// Función adicional para scroll suave programático
function scrollToSection(sectionId) {
    const target = document.querySelector(sectionId);
    if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let startTime = null;

        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + (distance * easeProgress));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }
}
