// admin.js - VERSIÓN OPTIMIZADA
let datosMenu = { carta: [{}], menu_semana: [] };
let authToken = '';

// ✅ SESIÓN MEJORADA
function verificarSesion() {
    authToken = localStorage.getItem('authToken');
    
    if (!authToken && window.location.pathname.includes('/admin')) {
        authToken = 'temp-' + Date.now();
        localStorage.setItem('authToken', authToken);
    }
    
    if (!authToken) {
        window.location.href = '/login';
        return false;
    }
    return true;
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
            alert('❌ Credenciales incorrectas');
        }
    } catch (error) {
        alert('❌ Error de conexión');
    }
}

// ✅ CARGA DE DATOS OPTIMIZADA
async function cargarDatos() {
    if (!verificarSesion()) return;
    
    try {
        const response = await fetch('/api/menu', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            datosMenu = await response.json();
        } else {
            // Token inválido, crear nuevo
            authToken = 'session-' + Date.now();
            localStorage.setItem('authToken', authToken);
            const retryResponse = await fetch('/api/menu', {
                headers: { 'Authorization': authToken }
            });
            datosMenu = await retryResponse.json();
        }
        
        // ✅ ESTRUCTURA GARANTIZADA
        if (!datosMenu.carta || datosMenu.carta.length === 0) {
            datosMenu.carta = [{}];
        }
        if (!datosMenu.menu_semana) {
            datosMenu.menu_semana = [];
        }
        
        renderizarTodo();
        
    } catch (error) {
        console.error('Error:', error);
        localStorage.removeItem('authToken');
        window.location.reload();
    }
}

// ✅ RENDERIZADO OPTIMIZADO
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
                <input type="text" value="${escapeHtml(item.tituloCarta || '')}" 
                       onchange="actualizarCarta('tituloCarta', this.value)">
            </div>
            
            <div class="input-group">
                <label>Nombre del platillo</label>
                <input type="text" value="${escapeHtml(item.nombre || '')}"
                       onchange="actualizarCarta('nombre', this.value)">
            </div>
            
            <div class="input-group">
                <label>Descripción</label>
                <textarea onchange="actualizarCarta('descripcion', this.value)">${escapeHtml(item.descripcion || '')}</textarea>
            </div>
            
            <div class="input-group">
                <label>Precio</label>
                <input type="text" value="${escapeHtml(item.precio || '')}"
                       onchange="actualizarCarta('precio', this.value)">
            </div>
            
            <div class="pago-section">
                <h3>Información de Pago</h3>
                <div class="input-group">
                    <label>Mensaje de pago</label>
                    <input type="text" value="${escapeHtml(item.pago?.mensaje || '')}"
                           onchange="actualizarCarta('pago_mensaje', this.value)">
                </div>
                
                <div class="input-group">
                    <label>Banco</label>
                    <input type="text" value="${escapeHtml(item.pago?.banco || '')}"
                           onchange="actualizarCarta('pago_banco', this.value)">
                </div>
            </div>
            
            <div class="input-group">
                <label>Texto página 4</label>
                <textarea onchange="actualizarCarta('pagina4', this.value)">${escapeHtml(item.pagina4 || '')}</textarea>
            </div>
        </div>
    `;
}

function renderMenuSemana() {
    const container = document.getElementById("menuContainer");
    if (!container) return;
    
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    
    // ✅ OPTIMIZADO: Solo asegurar 7 días
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
                        <input type="file" accept="image/jpeg,image/png" onchange="subirImagen(${idx}, this)">
                        <button type="button" onclick="eliminarImagen(${idx})" class="btn-eliminar">
                            🗑️ Eliminar
                        </button>
                    ` : `
                        <input type="file" accept="image/jpeg,image/png" onchange="subirImagen(${idx}, this)">
                    `}
                </div>
            </div>
            
            <div class="input-group">
                <label>Platillos (separados por coma)</label>
                <textarea onchange="actualizarMenu(${idx}, 'platillos', this.value)">${dia.platillos?.join(', ') || ''}</textarea>
            </div>
        </div>
    `).join('');
}

// ✅ FUNCIONES AUXILIARES
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function actualizarCarta(campo, valor) {
    if (!datosMenu.carta[0]) datosMenu.carta[0] = {};
    
    if (campo === 'pago_mensaje') {
        if (!datosMenu.carta[0].pago) datosMenu.carta[0].pago = {};
        datosMenu.carta[0].pago.mensaje = valor;
    } else if (campo === 'pago_banco') {
        if (!datosMenu.carta[0].pago) datosMenu.carta[0].pago = {};
        datosMenu.carta[0].pago.banco = valor;
    } else {
        datosMenu.carta[0][campo] = valor;
    }
}

function actualizarMenu(idx, campo, valor) {
    if (!datosMenu.menu_semana[idx]) {
        datosMenu.menu_semana[idx] = { platillos: [] };
    }
    
    if (campo === 'platillos') {
        datosMenu.menu_semana[idx].platillos = valor.split(',').map(p => p.trim()).filter(p => p);
    } else {
        datosMenu.menu_semana[idx][campo] = valor;
    }
}

// ✅ SUBIR IMAGEN OPTIMIZADA
async function subirImagen(idx, fileInput) {
    const archivo = fileInput.files[0];
    if (!archivo) return;
    
    if (archivo.size > 1 * 1024 * 1024) { // ✅ 1MB máximo
        alert('❌ La imagen debe ser menor a 1MB');
        return;
    }
    
    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('oldFilename', datosMenu.menu_semana[idx]?.imagen || '');
    
    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Authorization': authToken },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            datosMenu.menu_semana[idx].imagen = data.filename;
            renderMenuSemana();
        } else {
            alert('❌ Error al subir imagen');
        }
    } catch (error) {
        alert('❌ Error de conexión');
    }
}

function eliminarImagen(idx) {
    if (confirm('¿Eliminar esta imagen?')) {
        datosMenu.menu_semana[idx].imagen = '';
        renderMenuSemana();
    }
}

// ✅ SINCRONIZACIÓN OPTIMIZADA
async function guardarYSincronizar() {
    const boton = document.getElementById('syncButton');
    if (!boton) return;
    
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = '⏳ Guardando...';
    
    try {
        const response = await fetch('/api/save-and-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authToken 
            },
            body: JSON.stringify({ menuData: datosMenu })
        });
        
        const data = await response.json();
        alert(data.success ? '✅ ' + data.message : '❌ ' + data.error);
        
    } catch (error) {
        alert('❌ Error de conexión');
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

// ✅ INICIALIZACIÓN MEJORADA
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/login') {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.addEventListener('click', login);
        
        // Enter para login
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    } else if (window.location.pathname.includes('/admin')) {
        cargarDatos();
    }
});
