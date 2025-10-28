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

// ✅ CARGAR DATOS MEJORADO - CON PERSISTENCIA GARANTIZADA
async function cargarDatos() {
    if (!await verificarSesion()) return;
    
    try {
        console.log('📥 Cargando datos...');
        
        // PRIMERO: Intentar cargar datos persistentes SIN autenticación
        try {
            const publicResponse = await fetch('/api/public/menu?' + Date.now());
            if (publicResponse.ok) {
                const publicData = await publicResponse.json();
                datosMenu = publicData;
                console.log('✅ Datos cargados via API pública');
                renderizarTodo();
                return;
            }
        } catch (publicError) {
            console.log('⚠️ API pública no disponible, intentando método protegido');
        }
        
        // SEGUNDO: Intentar con autenticación
        const response = await fetch('/api/menu', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            datosMenu = await response.json();
            console.log('✅ Datos cargados via API protegida');
        } else {
            throw new Error('Error cargando datos protegidos');
        }
        
        // ESTRUCTURA GARANTIZADA
        if (!datosMenu.carta || datosMenu.carta.length === 0) {
            datosMenu.carta = [{}];
        }
        if (!datosMenu.menu_semana) {
            datosMenu.menu_semana = [];
        }
        
        renderizarTodo();
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        // ULTIMO RECURSO: Cargar desde GitHub directamente
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

// ✅ CARGAR DATOS DE RESPALDO
async function cargarDatosDeRespaldo() {
    try {
        console.log('🔄 Intentando cargar datos desde GitHub...');
        
        // Intentar cargar directamente desde GitHub RAW del repositorio de PRODUCCIÓN
        const response = await fetch('https://raw.githubusercontent.com/DanielRoblesFra/fondita-production/main/menu.json?' + Date.now());
        if (response.ok) {
            const menuData = await response.json();
            datosMenu = menuData;
            console.log('✅ Datos cargados desde GitHub Production');
            renderizarTodo();
            return true;
        }
    } catch (error) {
        console.log('❌ No se pudieron cargar datos desde GitHub Production');
    }
    
    try {
        // Intentar desde el repositorio principal como último recurso
        const response = await fetch('https://raw.githubusercontent.com/DanielRoblesFra/fondita/main/data/menu.json?' + Date.now());
        if (response.ok) {
            const menuData = await response.json();
            datosMenu = menuData;
            console.log('✅ Datos cargados desde GitHub Main');
            renderizarTodo();
            return true;
        }
    } catch (error) {
        console.log('❌ No se pudieron cargar datos desde ningún origen');
    }
    
    // Último recurso: datos por defecto
    datosMenu = { carta: [{}], menu_semana: [] };
    renderizarTodo();
    return false;
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
    const seccionesEspeciales = ["Ensaladas", "Promociones de temporada"];
    
    // Asegurar que tenemos 5 días de semana + 2 secciones especiales
    while (datosMenu.menu_semana.length > 7) {
        datosMenu.menu_semana.pop();
    }
    while (datosMenu.menu_semana.length < 7) {
        const index = datosMenu.menu_semana.length;
        if (index < 5) {
            // Días de la semana (0-4)
            datosMenu.menu_semana.push({ 
                dia: diasSemana[index],
                fecha: '',
                imagen: '',
                platillos: []
            });
        } else {
            // Secciones especiales (5-6)
            datosMenu.menu_semana.push({ 
                dia: seccionesEspeciales[index - 5],
                fecha: '',
                imagen: '',
                platillos: []
            });
        }
    }
    
    container.innerHTML = datosMenu.menu_semana.map((dia, idx) => {
        // Para los primeros 5 días (Lunes-Viernes), mostrar selector de día
        if (idx < 5) {
            return `
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
            `;
        } else {
            // Para Ensaladas y Promociones (índices 5 y 6) - MISMOS ESTILOS
            const titulo = idx === 5 ? "Ensaladas" : "Promociones de temporada";
            const labelPlatillos = idx === 5 ? 'Ensaladas disponibles' : 'Promociones disponibles';
            
            return `
                <div class="dia">
                    <div class="input-group">
                        <label>Sección</label>
                        <input type="text" value="${titulo}" readonly class="readonly-input">
                        <small class="input-note">(Título fijo - no editable)</small>
                    </div>
                    
                    <div class="input-group">
                        <label>Fecha de vigencia</label>
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
                        <label>${labelPlatillos} (separados por coma)</label>
                        <textarea onchange="actualizarMenu(${idx}, 'platillos', this.value)">${dia.platillos?.join(', ') || ''}</textarea>
                    </div>
                </div>
            `;
        }
    }).join('');
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

// ✅ ACTUALIZAR DATOS ANTES DE GUARDAR
function actualizarDatosDesdeFormularios() {
    console.log('🔄 Actualizando datos desde formularios...');
    
    // Forzar actualización de todos los campos del formulario
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        // Disparar evento change para que actualice datosMenu
        if (input.value !== input.defaultValue) {
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    });
}

// ✅ SUBIR IMAGEN (esto ya lo tienes después)
async function subirImagen(idx, fileInput) {
    // ... tu código existente ...
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
// ✅ GUARDAR Y SINCRONIZAR CON BARRA DE PROGRESO
async function guardarYSincronizar() {
    const boton = document.getElementById('syncButton');
    if (!boton) return;
    
    // ✅ ACTUALIZAR DATOS ANTES DE GUARDAR
    actualizarDatosDesdeFormularios();
    
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = '💾 Guardando...';
    
    try {
        console.log('📤 Enviando datos a servidor...');
        
        // ✅ PRIMERO: GUARDAR DATOS PERSISTENTEMENTE
        const saveResponse = await fetch('/api/save-persistent', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authToken 
            },
            body: JSON.stringify({ menuData: datosMenu })
        });
        
        const saveData = await saveResponse.json();
        
        if (!saveData.success) {
            throw new Error(saveData.error || 'Error al guardar');
        }
        
        console.log('✅ Datos guardados');
        
        // ✅ SEGUNDO: SINCRONIZAR
        boton.textContent = '🔄 Sincronizando...';
        
        // ✅ AGREGAR ESTA LÍNEA PARA LA BARRA DE PROGRESO:
        iniciarBarraProgreso();
        
        const syncResponse = await fetch('/api/save-and-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authToken 
            },
            body: JSON.stringify({ menuData: datosMenu })
        });
        
        const syncData = await syncResponse.json();
        
        if (syncData.success) {
            alert('✅ Cambios guardados correctamente');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
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
