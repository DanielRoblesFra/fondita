// FAQ functionality - Sin conflictos de variables
(function() {
    'use strict';
    
    function initFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        console.log('FAQ items encontrados:', faqItems.length);
        
        if (faqItems.length === 0) {
            console.log('No se encontraron elementos FAQ');
            return;
        }
        
        faqItems.forEach(function(item, index) {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (question && answer) {
                question.addEventListener('click', function() {
                    console.log('Click en pregunta:', index);
                    
                    const isActive = item.classList.contains('active');
                    
                    // Cerrar todas las preguntas
                    faqItems.forEach(function(otherItem) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) {
                            otherAnswer.classList.remove('active');
                        }
                    });
                    
                    // Si no estaba activa, abrirla
                    if (!isActive) {
                        item.classList.add('active');
                        answer.classList.add('active');
                        console.log('Pregunta abierta:', index);
                    }
                });
            }
        });
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFAQ);
    } else {
        initFAQ();
    }
    
})();