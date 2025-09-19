// scroll-optimizado.js - Elimina delay y animación lenta del primer clic
(function() {
    'use strict';
    
    let isScrolling = false;
    let initialized = false;
    
    // Configuración ultra-optimizada
    const config = {
        duration: 600,
        offset: 0,
        mobileOffset: 70
    };
    
    // Detectar móvil
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Easing simple y rápido
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Función de scroll optimizada para eliminar delays
    function smoothScroll(target, customDuration = null) {
        if (isScrolling) return;
        
        const targetElement = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
        
        if (!targetElement) return;
        
        // Cancelar cualquier comportamiento de scroll nativo INMEDIATAMENTE
        document.documentElement.style.scrollBehavior = 'auto';
        
        isScrolling = true;
        
        // Cálculos inmediatos sin delays
        const startPosition = window.pageYOffset;
        const targetRect = targetElement.getBoundingClientRect();
        const offset = isMobile() ? config.mobileOffset : config.offset;
        const targetPosition = targetRect.top + startPosition - offset;
        const distance = targetPosition - startPosition;
        const duration = customDuration || config.duration;
        
        // Para distancias muy pequeñas, scroll instantáneo
        if (Math.abs(distance) < 20) {
            window.scrollTo(0, targetPosition);
            isScrolling = false;
            return;
        }
        
        const startTime = performance.now();
        
        // Animación sin delays ni preparación
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            
            const currentPos = startPosition + (distance * easedProgress);
            window.scrollTo(0, currentPos);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                window.scrollTo(0, targetPosition);
                isScrolling = false;
            }
        }
        
        // Iniciar inmediatamente
        requestAnimationFrame(animate);
    }
    
    // Inicialización agresiva para prevenir delays
    function forceInit() {
        if (initialized) return;
        
        // Forzar override del scroll nativo
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        
        // Pre-cachear elementos comunes para evitar delays en querySelector
        const links = document.querySelectorAll('a[href^="#"]');
        const smoothElements = document.querySelectorAll('.smooth-scroll');
        
        // Event listeners con captura inmediata
        links.forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const href = this.getAttribute('href');
                if (href && href !== '#' && href !== '#!') {
                    // Sin setTimeout, sin delays - ejecutar inmediatamente
                    smoothScroll(href);
                }
            }, true); // Captura en fase de captura para mayor velocidad
        });
        
        smoothElements.forEach(element => {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const target = this.getAttribute('data-target') || 
                              this.getAttribute('href') || 
                              this.dataset.scroll;
                              
                if (target) {
                    smoothScroll(target);
                }
            }, true);
        });
        
        initialized = true;
        console.log('✅ Scroll optimizado - Sin delays activado');
    }
    
    // Función pública inmediata
    window.scrollToSection = function(sectionId, duration = 500) {
        if (typeof sectionId === 'string' && !sectionId.startsWith('#')) {
            sectionId = '#' + sectionId;
        }
        smoothScroll(sectionId, duration);
    };
    
    // Configuración inmediata
    window.setSmoothScrollConfig = function(newConfig) {
        Object.assign(config, newConfig);
    };
    
    // Inicialización inmediata y agresiva
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceInit);
    } else {
        forceInit();
    }
    
    // Backup de inicialización
    setTimeout(forceInit, 0);
    
    // Override completo del scroll behavior nativo
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            scroll-behavior: auto !important;
        }
    `;
    document.head.appendChild(style);
    
})();
