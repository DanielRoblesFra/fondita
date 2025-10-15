// admin.js - VERSIÓN CON MANEJO MEJORADO DE TOKENS
let datosMenu = { carta: [{}], menu_semana: [] };
let authToken = '';

// ✅ OBTENER TOKEN DE LA URL (para login tradicional)
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

// ✅ VERIFICAR SESIÓN MEJORADA
async function verificarSesion() {
    // Primero intentar con token de la URL (login tradicional)
    const urlToken = getTokenFromURL();
    if (urlToken) {
        authToken = urlToken;
        localStorage.setItem('authToken', authToken);
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('✅ Token obtenido de URL');
        return true;
    }
    
    // Luego intentar con localStorage
    authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.log('❌ No hay token, redirigiendo a login');
        window.location.href = '/login';
        return false;
    }
    
    // Verificar que el token sea válido
    try {
        const response = await fetch('/api/check-session', {
            headers: { 'Authorization': authToken }
        });
        
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        
        console.log('✅ Sesión verificada');
        return true;
    } catch (error) {
        console.log('❌ Token inválido, redirigiendo a login');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return false;
    }
}

// ✅ LOGIN OPTIMIZADO
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('❌ Usuario y contraseña requeridos');
        return;
    }
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            window.location.href = '/admin';
        } else {
            const errorData = await response.json();
            alert('❌ ' + (errorData.error || 'Credenciales incorrectas'));
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    }
}

// ✅ CARGAR DATOS CON MANEJO DE ERRORES MEJORADO
async function cargarDatos() {
    if (!await verificarSesion()) return;
    
    try {
        const response = await fetch('/api/menu', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            datosMenu = await response.json();
        } else {
            throw new Error('Error cargando datos');
        }
        
        // Estructura garantizada
        if (!datosMenu.carta || datosMenu.carta.length === 0) {
            datosMenu.carta = [{}];
        }
        if (!datosMenu.menu_semana) {
            datosMenu.menu_semana = [];
        }
        
        renderizarTodo();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('❌ Error de sesión. Serás redirigido al login.');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }
}

// ✅ FUNCIONES DE RENDERIZADO (mantener las que ya tienes)
function renderizarTodo() {
    renderCarta();
    renderMenuSemana();
}

function renderCarta() {
    const container = document.getElementById("cartaContainer");
    if (!container) return;
    
    const item = datosMenu.carta[0] || {};
    
    container.innerHTML = `
        <div class="hoja">
            <div class="input-group">
                <label>Título de la Carta</label>
                <input type="text" value="${item.tituloCarta || ''}" 
                       onchange="actualizarCarta('tituloCarta', this.value)">
            </div>
            
            <div class="input-group">
                <label>Nombre del platillo</label>
                <input type="text" value="${item.nombre || ''}"
                       onchange="actualizarCarta('nombre', this.value)">
            </div>
            
            <div class="input-group">
                <label>Descripción</label>
                <textarea onchange="actualizarCarta('descripcion', this.value)">${item.descripcion || ''}</textarea>
            </div>
            
            <div class="input-group">
                <label>Precio</label>
                <input type="text" value="${item.precio || ''}"
                       onchange="actualizarCarta('precio', this.value)">
            </div>
            
            <div class="pago-section">
                <h3>Información de Pago</h3>
                <div class="input-group">
                    <label>Mensaje de pago</label>
                    <input type="text" value="${item.pago?.mensaje || ''}"
                           onchange="actualizarCarta('pago_mensaje', this.value)">
                </div>
                
                <div class="input-group">
                    <label>Banco</label>
                    <input type="text" value="${item.pago?.banco || ''}"
                           onchange="actualizarCarta('pago_banco', this.value)">
                </div>
            </div>
            
            <div class="input-group">
                <label>Texto página 4</label>
                <textarea onchange="actualizarCarta('pagina4', this.value)">${item.pagina4 || ''}</textarea>
            </div>
        </div>
    `;
}

function renderMenuSemana() {
    const container = document.getElementById("menuContainer");
    if (!container) return;
    
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    
    while (datosMenu.menu_semana.length < 7) {
        datosMenu.menu_semana.push({ 
            dia: diasSemana[datosMenu.menu_semana.length],
            fecha: '',
            imagen: '',
            platillos: []
        });
    }
    
    container.innerHTML = datosMenu.menu_semana.map((dia, idx) => `
        <div class="dia">
            <div class="input-group">
                <label>Día</label>
                <select onchange="actualizarMenu(${idx}, 'dia', this.value)">
                    ${diasSemana.map(d => 
                        `<option value="${d}" ${d === dia.dia ? 'selected' : ''}>${d}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="input-group">
                <label>Fecha</label>
                <input type="date" value="${dia.fecha || ''}"
                       onchange="actualizarMenu(${idx}, 'fecha', this.value)">
            </div>
            
            <div class="input-group">
                <label>Imagen</label>
                <div class="imagen-controls">
                    ${dia.imagen ? `
                        <img src="/img/${dia.imagen}?t=${Date.now()}" class="img-preview">
                        <input type="file" accept="image/jpeg,image/png" onchange="sub
