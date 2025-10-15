// admin.js
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
        // Primero intentar cargar datos persistentes
        const persistentResponse = await fetch('/api/load-persistent-data', {
            headers: { 'Authorization': authToken }
        });
        
        if (persistentResponse.ok) {
            const persistentData = await persistentResponse.json();
            
            if (persistentData.success) {
                datosMenu = persistentData.menuData;
                console.log('✅ Datos persistentes cargados');
                
                // Verificar que las imágenes todavía existen
                await verificarImagenesPersistentes(persistentData.availableImages);
                
                renderizarTodo();
                return; // Salir, ya tenemos los datos
            }
        }
        
        // Fallback: cargar datos normales (para compatibilidad)
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
        // Intentar cargar datos persistentes sin autenticación como último recurso
        await cargarDatosDeRespaldo();
    }
}

// ✅ VERIFICAR IMÁGENES PERSISTENTES
async function verificarImagenesPersistentes(availableImages) {
    const imageSet = new Set(availableImages);
    
    // Verificar cada día del menú semanal
    datosMenu.menu_semana.forEach(dia => {
        if (dia.imagen && !imageSet.has(dia.imagen)) {
            console.log(`⚠️ Imagen no encontrada: ${dia.imagen}`);
            dia.imagen = ''; // Limpiar imagen faltante
        }
    });
}

// ✅ CARGAR DATOS DE RESPALDO (sin autenticación)
async function cargarDatosDeRespaldo() {
    try {
        const response = await fetch('/api/load-persistent-data');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                datosMenu = data.menuData;
                renderizarTodo();
                return;
            }
        }
    } catch (error) {
        console.log('No se pudieron cargar datos de respaldo');
    }
    
    alert('❌ Error de sesión. Serás redirigido al login.');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}

// ✅ FUNCIONES DE RENDERIZADO
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
    
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    
    while (datosMenu.menu_semana.length > 5) {
        datosMenu.menu_semana.pop();
    }
    while (datosMenu.menu_semana.length < 5) {
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
                        <div class="img-preview-container">
                            <img src="/img/${dia.imagen}?t=${Date.now()}" class="img-preview" alt="Vista previa">
                        </div>
                    ` : ''}
                    
                    <!-- ✅ BOTÓN SUBIR ARCHIVO SIMPLIFICADO Y FUNCIONAL -->
                    <div class="file-input-container">
                        <input type="file" 
                               id="file-input-${idx}"
                               accept="image/jpeg, image/png" 
                               onchange="subirImagen(${idx}, this)"
                               class="hidden-image-input">
                        <label for="file-input-${idx}" class="file-input-label">
                            <span class="file-input-icon">📁</span>
                            ${dia.imagen ? 'Cambiar imagen' : 'Seleccionar imagen'}
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="input-group">
                <label>Platillos (separados por coma)</label>
                <textarea onchange="actualizarMenu(${idx}, 'platillos', this.value)">${dia.platillos?.join(', ') || ''}</textarea>
            </div>
        </div>
    `).join('');
}

// ✅ FUNCIONES DE ACTUALIZACIÓN
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

// ✅ SUBIR IMAGEN
async function subirImagen(idx, fileInput) {
    const archivo = fileInput.files[0];
    if (!archivo) return;
    
    if (archivo.size > 1 * 1024 * 1024) {
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
            alert('✅ Imagen subida correctamente');
            renderMenuSemana();
        } else {
            alert('❌ Error al subir imagen');
        }
    } catch (error) {
        alert('❌ Error de conexión al subir imagen');
    }
}

function eliminarImagen(idx) {
    if (confirm('¿Eliminar esta imagen?')) {
        datosMenu.menu_semana[idx].imagen = '';
        renderMenuSemana();
    }
}

// ✅ GUARDAR Y SINCRONIZAR CON BARRA DE PROGRESO
async function guardarYSincronizar() {
    const boton = document.getElementById('syncButton');
    if (!boton) return;
    
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = '⏳ Iniciando...';
    
    try {
        // 1. INICIAR BARRA DE PROGRESO INMEDIATAMENTE
        iniciarBarraProgreso();
        
        // 2. ENVIAR PETICIÓN AL SERVIDOR
        const response = await fetch('/api/save-and-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authToken 
            },
            body: JSON.stringify({ menuData: datosMenu })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert('❌ ' + (data.error || 'Error desconocido'));
        }
        // NO mostramos alerta de éxito - la barra ya muestra el progreso
        
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

// ✅ LOGOUT
async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Authorization': authToken }
        });
    } catch (error) {
        // Ignorar errores en logout
    }
    
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}

// ✅ INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/login') {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', login);
        }
        
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    } else if (window.location.pathname.includes('/admin')) {
        cargarDatos();
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});

// ==================== BARRA DE PROGRESO DE 3 MINUTOS ====================

// ✅ CREAR LA BARRA DE PROGRESO DINÁMICAMENTE
function crearBarraProgreso() {
    const overlay = document.createElement('div');
    overlay.className = 'progress-overlay';
    overlay.innerHTML = `
        <div class="progress-container">
            <div class="progress-title">🔄 Sincronizando Cambios</div>
            <div class="progress-message">
                Los cambios estarán visibles para los usuarios en aproximadamente 3-5 minutos.
            </div>
            <div class="progress-time" id="progressTime">3:00</div>
            <div class="progress-bar-container">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="progress-info">
                Actualizando: https://danielroblesfra.github.io/fondita-production/
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

// ✅ INICIAR BARRA DE PROGRESO (3 MINUTOS EXACTOS)
function iniciarBarraProgreso() {
    const overlay = crearBarraProgreso();
    const progressBar = document.getElementById('progressBar');
    const progressTime = document.getElementById('progressTime');
    
    let secondsLeft = 180; // 3 minutos = 180 segundos
    const totalSeconds = 180;
    
    overlay.classList.add('active');
    
    const interval = setInterval(() => {
        secondsLeft--;
        
        // Actualizar tiempo
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        progressTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Actualizar barra (100% al inicio, 0% al final)
        const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
        progressBar.style.width = progress + '%';
        
        // Finalizar después de 3 minutos
        if (secondsLeft <= 0) {
            clearInterval(interval);
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 500);
            }, 1000);
        }
    }, 1000);
}
