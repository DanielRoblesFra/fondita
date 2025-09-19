// auto-update.js - Sistema de notificación de actualizaciones
class UpdateNotifier {
    constructor() {
        this.checkInterval = 2 * 60 * 1000; // 2 minutos
        this.init();
    }

    init() {
        this.injectStyles();
        this.checkForUpdates();
        setInterval(() => this.checkForUpdates(), this.checkInterval);
        
        // También verificar cuando la página gana focus
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.checkForUpdates();
        });
    }

    async checkForUpdates() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/version?t=${timestamp}`);
            const data = await response.json();
            
            const lastUpdate = localStorage.getItem('fondita_lastUpdate');
            
            if (!lastUpdate) {
                localStorage.setItem('fondita_lastUpdate', data.version);
            } else if (lastUpdate !== data.version) {
                this.showUpdateNotification();
            }
        } catch (error) {
            console.log('✅ Check de actualización:', error.message);
        }
    }

    showUpdateNotification() {
        // Evitar duplicados
        if (document.getElementById('update-notification')) return;

        const notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #25d366, #128C7E);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            z-index: 10000;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            cursor: pointer;
            animation: slideInRight 0.5s ease;
            font-family: 'Arial', sans-serif;
            max-width: 300px;
            border: 2px solid #0daa5c;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">
                🎉 ¡Hay novedades!
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
                Haz clic aquí para ver los últimos cambios
            </div>
        `;
        
        notification.onclick = () => {
            localStorage.setItem('fondita_lastUpdate', Date.now());
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => notification.remove(), 500);
            window.location.reload(true);
        };
        
        document.body.appendChild(notification);

        // Auto-ocultar después de 15 segundos
        setTimeout(() => {
            if (document.getElementById('update-notification')) {
                notification.style.animation = 'slideOutRight 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 15000);
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            #update-notification:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new UpdateNotifier();
});
