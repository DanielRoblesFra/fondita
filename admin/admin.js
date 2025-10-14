// admin.js
let datosMenu = { carta: [{}], menu_semana: [] };
let authToken = '';

// ==================== MANEJO DE SESIÓN ====================

// Verificar sesión al cargar
function verificarSesion() {
    authToken = localStorage.getItem('authToken');
    
    // Si no hay token pero estamos en /admin, crear uno temporal
    if (!authToken && window.location.pathname.includes('/admin')) {
        authToken = 'traditional-login-' + Date.now();
        localStorage.setItem('authToken', authToken);
        console.log('🔐 Token temporal creado para login tradicional');
    }
    
    if (!authToken) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// LOGIN simple
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
        
        const data = await response.json();
        
        if (data.token) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            window.location.href = '/admin';
        } else {
            alert('❌ Error: ' + (data.error || 'Credenciales incorrectas'));
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}

// ==================== CARGA DE DATOS ====================

// Cargar datos al iniciar - VERSIÓN CORREGIDA
async function cargarDatos() {
    if (!verificarSesion()) return;
    
    try {
        const response = await fetch('/api/menu', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.status === 401) {
            // Sesión expirada o token inválido
            console.log('🔄 Token inválido, intentando con token temporal...');
            
            // Crear nuevo token temporal
            authToken = 'session-' + Date.now();
            localStorage.setItem('authToken', authToken);
            
            // Reintentar con nuevo token
            const retryResponse = await fetch('/api/menu', {
                headers: { 'Authorization': authToken }
            });
            
            if (!retryResponse.ok) throw new Error('No autorizado');
            
            const data = await retryResponse.json();
            datosMenu = data;
        } else if (!response.ok) {
            throw new Error('Error cargando datos');
        } else {
            // Todo bien, cargar datos normalmente
            const data = await response.json();
            datosMenu = data;
        }
        
        // Asegurar estructura básica
        if (!datosMenu.carta || datosMenu.carta.length === 0) {
            datosMenu.carta = [{}];
        }
        if (!datosMenu.menu_semana) {
            datosMenu.menu_semana = [];
        }
        
        renderizarTodo();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('⚠️ Error de sesión. Recargando...');
        localStorage.removeItem('authToken');
        window.location.reload();
    }
}

// ==================== RENDERIZADO ====================

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
                       onchange="actualizarCarta('tituloCarta', this.value)"
                       placeholder="Título del libro">
            </div>
            
            <div class="input-group">
                <label>Nombre del platillo</label>
                <input type="text" value="${item.nombre || ''}"
                       onchange="actualizarCarta('nombre', this.value)"
                       placeholder="Nombre del platillo">
            </div>
            
            <div class="input-group">
                <label>Descripción</label>
                <textarea onchange="actualizarCarta('descripcion', this.value)"
                          placeholder="Descripción del platillo...">${item.descripcion || ''}</textarea>
            </div>
            
            <div class="input-group">
                <label>Precio</label>
                <input type="text" value="${item.precio || ''}"
                       onchange="actualizarCarta('precio', this.value)"
                       placeholder="$100">
            </div>
            
            <div class="pago-section">
                <h3>Información de Pago</h3>
                <div class="input-group">
                    <label>Mensaje de pago</label>
                    <input type="text" value="${item.pago?.mensaje || ''}"
                           onchange="actualizarCarta('pago_mensaje', this.value)"
                           placeholder="Transferencia a: Claudia">
                </div>
                
                <div class="input-group">
                    <label>Banco</label>
                    <input type="text" value="${item.pago?.banco || ''}"
                           onchange="actualizarCarta('pago_banco', this.value)"
                           placeholder="BBVA: ***********59">
                </div>
            </div>
            
            <div class="input-group">
                <label>Texto página 4</label>
                <textarea onchange="actualizarCarta('pagina4', this.value)"
                          placeholder="Mensaje adicional para la última página...">${item.pagina4 || ''}</textarea>
            </div>
        </div>
    `;
}

function renderMenuSemana() {
    const container = document.getElementById("menuContainer");
    if (!container) return;
    
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    
    // Asegurar 7 días
    while (datosMenu.menu_semana.length < 7) {
        datosMenu.menu_semana.push({ 
            dia: diasSemana[datosMenu.menu_semana.length] || '',
            fecha: '',
            imagen: '',
            platillos: []
        });
    }
    
    container.innerHTML = datosMenu.menu_semana.map((dia, idx) => `
        <div class="dia">
            <div class="input-group">
                <label>Día de la semana</label>
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
                <label>Imagen del día</label>
                <div class="imagen-controls">
                    ${dia.imagen ? `
                        <div class="img-preview-container">
                            <img src="/img/${dia.imagen}?t=${Date.now()}" class="img-preview" alt="Vista previa">
                        </div>
                    ` : ''}
                    <input type="file" 
                           accept="image/jpeg, image/png" 
                           onchange="subirImagen(${idx}, this)"
                           style="margin-top: 10px;">
                    ${dia.imagen ? `
                        <button type="button" onclick="eliminarImagen(${idx})" 
                                style="margin-top: 5px; background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            🗑️ Eliminar imagen
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="input-group">
                <label>Platillos (separados por coma)</label>
                <textarea onchange="actualizarMenu(${idx}, 'platillos', this.value)"
                          placeholder="Sopa de verduras, Pollo asado, Arroz blanco, Agua de fruta">${dia.platillos?.join(', ') || ''}</textarea>
            </div>
        </div>
    `).join('');
}

// ==================== ACTUALIZACIÓN DE DATOS ====================

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
        datosMenu.menu_semana[idx].platillos = valor.split(',').map(p => p.trim()).filter(p => p !== '');
    } else {
        datosMenu.menu_semana[idx][campo] = valor;
    }
}

// ==================== MANEJO DE IMÁGENES ====================

async function subirImagen(idx, fileInput) {
    const archivo = fileInput.files[0];
    if (!archivo) return;
    
    // Validar tipo de archivo
    if (!archivo.type.match('image/jpeg') && !archivo.type.match('image/png')) {
        alert('❌ Solo se permiten imágenes JPEG o PNG');
        return;
    }
    
    // Validar tamaño (2MB)
    if (archivo.size > 2 * 1024 * 1024) {
        alert('❌ La imagen debe ser menor a 2MB');
        return;
    }
    
    const formData = new FormData();
    formData.append('imagen', archivo);
    
    // Enviar imagen anterior para eliminación
    const imagenAnterior = datosMenu.menu_semana[idx]?.imagen;
    if (imagenAnterior) {
        formData.append('oldFilename', imagenAnterior);
    }
    
    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Authorization': authToken },
            body: formData
        });
        
        const data = await response.json();
        if (data.filename) {
            datosMenu.menu_semana[idx].imagen = data.filename;
            alert('✅ Imagen subida correctamente');
            // Recargar la vista para mostrar nueva imagen
            renderMenuSemana();
        } else {
            alert('❌ Error al subir imagen');
        }
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        alert('❌ Error de conexión al subir imagen');
    }
}

function eliminarImagen(idx) {
    if (confirm('¿Eliminar esta imagen?')) {
        datosMenu.menu_semana[idx].imagen = '';
        renderMenuSemana();
    }
}

// ==================== SINCRONIZACIÓN ====================

async function guardarYSincronizar() {
    const boton = document.getElementById('syncButton');
    if (!boton) {
        alert('❌ Botón no encontrado');
        return;
    }
    
    const textoOriginal = boton.textContent;
    
    boton.disabled = true;
    boton.textContent = '⏳ Guardando y sincronizando...';
    
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
        
        if (data.success) {
            alert('✅ ' + data.message);
        } else {
            alert('❌ ' + (data.error || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión: ' + error.message);
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

// ==================== INICIALIZACIÓN ====================

// Inicializar según la página
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/login' || window.location.pathname === '/') {
        // Página de login - agregar evento al botón
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', login);
        }
        // También permitir login con Enter
        const inputs = document.querySelectorAll('#username, #password');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') login();
            });
        });
    } else if (window.location.pathname.includes('/admin')) {
        // Página admin - cargar datos
        cargarDatos();
        
        // Agregar botón de logout si existe
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});
