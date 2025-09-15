// scoll.js - Scroll suave universal para navegación y rueda del ratón
document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const scrollDuration = 500; // duración en ms
    const scrollStep = 1500; // píxeles por paso de scroll
    let isScrolling = false;
    let scrollTimeout;

    // Función de easing (suavizado)
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // Función de scroll suave para navegación
    function smoothScrollTo(target) {
        if (isScrolling) return;
        
        const targetElement = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
        
        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        isScrolling = true;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / scrollDuration, 1);
            const easeProgress = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + (distance * easeProgress));
            
            if (timeElapsed < scrollDuration) {
                requestAnimationFrame(animation);
            } else {
                isScrolling = false;
            }
        }

        requestAnimationFrame(animation);
    }

    // Scroll suave con rueda del ratón
    function handleWheelScroll(e) {
        if (isScrolling) {
            e.preventDefault();
            return;
        }

        // Detectar dirección del scroll
        const delta = Math.sign(e.deltaY);
        const currentPosition = window.pageYOffset;
        let targetPosition;

        if (delta > 0) {
            // Scroll hacia abajo - ir a la siguiente sección
            targetPosition = findNextSection(currentPosition);
        } else {
            // Scroll hacia arriba - ir a la sección anterior
            targetPosition = findPreviousSection(currentPosition);
        }

        if (targetPosition !== null && targetPosition !== currentPosition) {
            e.preventDefault();
            smoothScrollToPosition(targetPosition);
        }
    }

    // Encontrar la siguiente sección
    function findNextSection(currentPos) {
        const sections = document.querySelectorAll('section, .inicio');
        let nextSection = null;
        let minDistance = Infinity;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const distance = sectionTop - currentPos;
            
            if (distance > 50 && distance < minDistance) {
                minDistance = distance;
                nextSection = sectionTop;
            }
        });

        return nextSection !== null ? nextSection : currentPos + window.innerHeight;
    }

    // Encontrar la sección anterior
    function findPreviousSection(currentPos) {
        const sections = document.querySelectorAll('section, .inicio');
        let prevSection = null;
        let minDistance = Infinity;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const distance = currentPos - sectionTop;
            
            if (distance > 50 && distance < minDistance) {
                minDistance = distance;
                prevSection = sectionTop;
            }
        });

        return prevSection !== null ? prevSection : Math.max(0, currentPos - window.innerHeight);
    }

    // Scroll suave a una posición específica
    function smoothScrollToPosition(targetPosition) {
        if (isScrolling) return;

        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        isScrolling = true;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / scrollDuration, 1);
            const easeProgress = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + (distance * easeProgress));
            
            if (timeElapsed < scrollDuration) {
                requestAnimationFrame(animation);
            } else {
                isScrolling = false;
            }
        }

        requestAnimationFrame(animation);
    }

    // Scroll suave incremental con rueda (alternativa)
    function handleIncrementalWheelScroll(e) {
        if (isScrolling) {
            e.preventDefault();
            return;
        }

        clearTimeout(scrollTimeout);
        const delta = Math.sign(e.deltaY) * scrollStep;
        const targetPosition = window.pageYOffset + delta;

        e.preventDefault();
        smoothScrollToPosition(targetPosition);

        // Pequeño timeout para evitar scroll muy rápido
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 100);
    }

    // Aplicar scroll suave a enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if (target !== '#') {
                smoothScrollTo(target);
            }
        });
    });

    // Elegir el tipo de scroll de rueda (descomenta uno)
    
    // Opción 1: Scroll por secciones (recomendado)
    window.addEventListener('wheel', handleWheelScroll, { passive: false });
    
    // Opción 2: Scroll incremental suave
    // window.addEventListener('wheel', handleIncrementalWheelScroll, { passive: false });

    // Desactivar el scroll suave en elementos específicos
    const scrollExceptions = document.querySelectorAll('.card, .book, .faq-item');
    scrollExceptions.forEach(element => {
        element.addEventListener('wheel', function(e) {
            e.stopPropagation();
        });
    });

    console.log('✅ Scroll suave activado para navegación y rueda del ratón');
});

// Función para scroll programático
function scrollToSection(sectionId) {
    const target = document.querySelector(sectionId);
    if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let startTime = null;
        let isScrolling = true;

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
            } else {
                isScrolling = false;
            }
        }

        requestAnimationFrame(animation);
    }
}
