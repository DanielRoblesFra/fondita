// admin.js
let datosMenu = {};

// 🛡️ DETECCIÓN DE SESIÓN EXPIRADA
let lastActivity = Date.now();
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos en milisegundos

// Función para verificar sesión
function verificarSesion() {
    const tiempoInactivo = Date.now() - lastActivity;
    
    if (tiempoInactivo >= SESSION_TIMEOUT) {
        console.log('🕒 Sesión expirada por inactividad');
        cerrarSesionAutomaticamente();
        return;
    }

    // Verificar sesión con el servidor cada 30 segundos
    fetch("/api/menu", {
        method: "GET",
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('Sesión expirada');
        }
        return res.json();
    })
    .catch(err => {
        console.log('🔐 Sesión expirada en servidor:', err.message);
        cerrarSesionAutomaticamente();
    });
}

// Función para cerrar sesión automáticamente
function cerrarSesionAutomaticamente() {
    // Mostrar mensaje al usuario
    alert('🕒 Tu sesión ha expirado por seguridad. Serás redirigido al login.');
    
    // Redirigir al login
    window.location.href = '/login';
}

// Actualizar tiempo de actividad con cualquier interacción del usuario
function actualizarActividad() {
    lastActivity = Date.now();
}

// Event listeners para detectar actividad del usuario
document.addEventListener('click', actualizarActividad);
document.addEventListener('keypress', actualizarActividad);
document.addEventListener('mousemove', actualizarActividad);
document.addEventListener('scroll', actualizarActividad);

// Verificar sesión periódicamente
setInterval(verificarSesion, 30000); // Cada 30 segundos

// También verificar al cargar la página
window.addEventListener('load', () => {
    setTimeout(verificarSesion, 1000);
});


// Cargar datos al iniciar
window.addEventListener("DOMContentLoaded", () => {
    fetch("/api/menu")
        .then(res => res.json())
        .then(data => {
            datosMenu = data;
            renderCarta();
            renderMenuSemana();
        })
        .catch(err => console.error("Error cargando menú:", err));
}); 

//  Confimacion al salir de sesion
const logoutLink = document.getElementById('logoutLink');
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        if (!confirm('¿Cerrar sesión?')) e.preventDefault();
    });
}

// ------------------ Renderizar Carta ------------------
function renderCarta() {
    const container = document.getElementById("cartaContainer");
    container.innerHTML = "";

    datosMenu.carta.forEach((item, idx) => {
        const div = document.createElement("div");
        div.className = "hoja";
        
        // Grupo para Título "Carta del día"
        const tituloCartaGroup = document.createElement("div");
        tituloCartaGroup.className = "input-group";
        const labelTituloCarta = document.createElement("label");
        labelTituloCarta.textContent = "Título de la Carta";
        labelTituloCarta.htmlFor = `titulo-carta-${idx}`;
        const inputTituloCarta = document.createElement("input");
        inputTituloCarta.type = "text";
        inputTituloCarta.id = `titulo-carta-${idx}`;
        inputTituloCarta.value = item.tituloCarta || "Titulo";
        inputTituloCarta.dataset.tipo = "carta";
        inputTituloCarta.dataset.index = idx;
        inputTituloCarta.dataset.campo = "tituloCarta";
        inputTituloCarta.placeholder = "Ej: Titulo del libro";
        tituloCartaGroup.appendChild(labelTituloCarta);
        tituloCartaGroup.appendChild(inputTituloCarta);

        
        // Grupo para Nombre
        const nombreGroup = document.createElement("div");
        nombreGroup.className = "input-group";
        const labelNombre = document.createElement("label");
        labelNombre.textContent = "Nombre del platillo";
        labelNombre.htmlFor = `nombre-${idx}`;
        const inputNombre = document.createElement("input");
        inputNombre.type = "text";
        inputNombre.id = `nombre-${idx}`;
        inputNombre.value = item.nombre;
        inputNombre.dataset.tipo = "carta";
        inputNombre.dataset.index = idx;
        inputNombre.dataset.campo = "nombre";
        inputNombre.placeholder = "Ej: Texto";
        nombreGroup.appendChild(labelNombre);
        nombreGroup.appendChild(inputNombre);

        // Grupo para Descripción
        const descGroup = document.createElement("div");
        descGroup.className = "input-group";
        const labelDesc = document.createElement("label");
        labelDesc.textContent = "Descripción";
        labelDesc.htmlFor = `desc-${idx}`;
        const textareaDesc = document.createElement("textarea");
        textareaDesc.id = `desc-${idx}`;
        textareaDesc.value = item.descripcion;
        textareaDesc.dataset.tipo = "carta";
        textareaDesc.dataset.index = idx;
        textareaDesc.dataset.campo = "descripcion";
        textareaDesc.placeholder = "Ej: Pasta con salsa cremosa de queso parmesano...";
        textareaDesc.rows = 3;
        descGroup.appendChild(labelDesc);
        descGroup.appendChild(textareaDesc);

        // Grupo para Precio
        const precioGroup = document.createElement("div");
        precioGroup.className = "input-group";
        const labelPrecio = document.createElement("label");
        labelPrecio.textContent = "Precio";
        labelPrecio.htmlFor = `precio-${idx}`;
        const inputPrecio = document.createElement("input");
        inputPrecio.type = "text";
        inputPrecio.id = `precio-${idx}`;
        inputPrecio.value = item.precio;
        inputPrecio.dataset.tipo = "carta";
        inputPrecio.dataset.index = idx;
        inputPrecio.dataset.campo = "precio";
        inputPrecio.placeholder = "Ej: $100";
        precioGroup.appendChild(labelPrecio);
        precioGroup.appendChild(inputPrecio);

        // Grupo para Información de Pago
        const pagoSection = document.createElement("div");
        pagoSection.className = "pago-section";
        
        const pagoTitle = document.createElement("h3");
        pagoTitle.textContent = "Información de Pago";
        pagoTitle.style.color = "#ccc";
        pagoTitle.style.marginBottom = "1rem";
        pagoTitle.style.fontSize = "1.1rem";
        pagoSection.appendChild(pagoTitle);

         // Mensaje de pago
        const pagoMensajeGroup = document.createElement("div");
        pagoMensajeGroup.className = "input-group";
        const labelPago = document.createElement("label");
        labelPago.textContent = "Mensaje de pago";
        labelPago.htmlFor = `pago-msg-${idx}`;
        const inputPago = document.createElement("input");
        inputPago.type = "text";
        inputPago.id = `pago-msg-${idx}`;
        inputPago.value = item.pago.mensaje;
        inputPago.dataset.tipo = "carta";
        inputPago.dataset.index = idx;
        inputPago.dataset.campo = "pago_mensaje";
        inputPago.placeholder = "Ej: Transferencia a: Claudia";
        pagoMensajeGroup.appendChild(labelPago);
        pagoMensajeGroup.appendChild(inputPago);

        // Banco
        const bancoGroup = document.createElement("div");
        bancoGroup.className = "input-group";
        const labelBanco = document.createElement("label");
        labelBanco.textContent = "Banco";
        labelBanco.htmlFor = `banco-${idx}`;
        const inputBanco = document.createElement("input");
        inputBanco.type = "text";
        inputBanco.id = `banco-${idx}`;
        inputBanco.value = item.pago.banco;
        inputBanco.dataset.tipo = "carta";
        inputBanco.dataset.index = idx;
        inputBanco.dataset.campo = "pago_banco";
        inputBanco.placeholder = "Ej: BBVA: ***********59";
        bancoGroup.appendChild(labelBanco);
        bancoGroup.appendChild(inputBanco);

        pagoSection.appendChild(pagoMensajeGroup);
        pagoSection.appendChild(bancoGroup);

        // 🎯 PÁGINA 4 
        const pagina4Group = document.createElement("div");
        pagina4Group.className = "input-group";
        pagina4Group.style.marginTop = "20px";
        
        const labelPagina4 = document.createElement("label");
        labelPagina4.textContent = "Escribe texto para la página 4";
        labelPagina4.htmlFor = `pagina4-${idx}`;
        labelPagina4.style.fontWeight = "bold";
        
        const textareaPagina4 = document.createElement("textarea");
        textareaPagina4.id = `pagina4-${idx}`;
        textareaPagina4.value = item.pagina4 || "";
        textareaPagina4.dataset.tipo = "carta";
        textareaPagina4.dataset.index = idx;
        textareaPagina4.dataset.campo = "pagina4";
        textareaPagina4.placeholder = "Ej: Mensaje para la hoja 4";
        textareaPagina4.rows = 4;
        textareaPagina4.style.width = "100%";
        
        pagina4Group.appendChild(labelPagina4);
        pagina4Group.appendChild(textareaPagina4);

        div.appendChild(tituloCartaGroup);
        div.appendChild(nombreGroup);
        div.appendChild(descGroup);
        div.appendChild(precioGroup); 
        div.appendChild(pagoSection);
        div.appendChild(pagina4Group);
    
        container.appendChild(div);
    }); 
} 
// ------------------ Renderizar Menú de la Semana ------------------
function renderMenuSemana() {
    const container = document.getElementById("menuContainer");
    container.innerHTML = "";

    // Array con los días de la semana en español
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    datosMenu.menu_semana.forEach((dia, idx) => {
        const div = document.createElement("div");
        div.className = "dia";

        // Día - ahora como select
        const labelDia = document.createElement("label");
        labelDia.textContent = "Día de la semana";
        labelDia.htmlFor = `dia-${idx}`;
        
        const selectDia = document.createElement("select");
        selectDia.id = `dia-${idx}`;
        selectDia.dataset.tipo = "menu";
        selectDia.dataset.index = idx;
        selectDia.dataset.campo = "dia";
        
        // Opciones para los días de la semana
        diasSemana.forEach(diaOption => {
            const option = document.createElement("option");
            option.value = diaOption;
            option.textContent = diaOption;
            if (dia.dia === diaOption) {
                option.selected = true;
            }
            selectDia.appendChild(option);
        });

        // Fecha - ahora con tipo date
        const labelFecha = document.createElement("label");
        labelFecha.textContent = "Fecha";
        labelFecha.htmlFor = `fecha-${idx}`;
        
        const inputFecha = document.createElement("input");
        inputFecha.type = "date";
        inputFecha.id = `fecha-${idx}`;
        inputFecha.value = dia.fecha || "";
        inputFecha.dataset.tipo = "menu";
        inputFecha.dataset.index = idx;
        inputFecha.dataset.campo = "fecha";

        // Imagen - interfaz mejorada
        const imagenSection = document.createElement("div");
        imagenSection.className = "imagen-section";
        
        const labelImg = document.createElement("label");
        labelImg.textContent = "Imagen del día";
        
        // Contenedor para la previsualización y controles
        const imagenControls = document.createElement("div");
        imagenControls.className = "imagen-controls";
        
        // Preview de imagen actual
        const imgPreviewContainer = document.createElement("div");
        imgPreviewContainer.className = "img-preview-container";
        
        const imgPreview = document.createElement("img");
        imgPreview.className = "img-preview";
        if (dia.imagen) {
            imgPreview.src = `/img/${dia.imagen}?v=${Date.now()}`;
        } else {
            imgPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='none'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Cpath d='M35 40L50 25L65 40M30 65H70M40 50H60' stroke='%23555' stroke-width='2'/%3E%3C/svg%3E";
        }
        imgPreview.alt = "Vista previa de la imagen";
        
        // Botón personalizado para subir imagen
        const fileInputContainer = document.createElement("div");
        fileInputContainer.className = "file-input-container";
        
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.id = `imagen-${idx}`;
        fileInput.accept = ".jpg,.jpeg,.png";
        fileInput.className = "file-input";
        
        const fileInputLabel = document.createElement("label");
        fileInputLabel.htmlFor = `imagen-${idx}`;
        fileInputLabel.className = "file-input-label";
        fileInputLabel.innerHTML = '<span class="file-input-icon">📷</span> Seleccionar imagen';
        
        // Input oculto para el nombre del archivo
        const inputImg = document.createElement("input");
        inputImg.type = "hidden";
        inputImg.value = dia.imagen;
        inputImg.dataset.tipo = "menu";
        inputImg.dataset.index = idx;
        inputImg.dataset.campo = "imagen";
        inputImg.className = "hidden-image-input";

// Manejo de la selección de archivo
fileInput.addEventListener("change", e => {
    if (!e.target.files[0]) return;
    
    // Actualizar la interfaz
    fileInputLabel.innerHTML = '<span class="file-input-icon">⏳</span> Subiendo...';
    
    const formData = new FormData();
    formData.append("imagen", e.target.files[0]);
    
    // Enviamos el nombre de la imagen actual para que sea eliminada
    const imagenAnterior = dia.imagen;
    if (imagenAnterior && imagenAnterior.trim() !== "") {
        formData.append("oldFilename", imagenAnterior);
    }

    fetch("/api/upload-image", {
        method: "POST",
        body: formData,
        credentials: 'include'
    })
        .then(res => res.json())
        .then(resp => {
            // Actualizar el input oculto con el nuevo nombre
            inputImg.value = resp.filename;
            
            // ✅ CORREGIDO: Actualizar los datos en memoria
            datosMenu.menu_semana[idx].imagen = resp.filename;
            
            // ✅ NUEVO: Guardar los cambios automáticamente en el servidor
            guardarCambiosAutomaticos();
            
            // Actualizar preview de imagen
            imgPreview.src = `/img/${resp.filename}`;
            
            // Restaurar texto del botón
            fileInputLabel.innerHTML = '<span class="file-input-icon">✅</span> Imagen subida';
            
            // Resetear después de un tiempo
            setTimeout(() => {
                fileInputLabel.innerHTML = '<span class="file-input-icon">📷</span> Cambiar imagen';
            }, 2000);
        })
        .catch(err => {
            console.error("Error subiendo imagen:", err);
            fileInputLabel.innerHTML = '<span class="file-input-icon">❌</span> Error, intentar again';
            
            setTimeout(() => {
                fileInputLabel.innerHTML = '<span class="file-input-icon">📷</span> Seleccionar imagen';
            }, 2000);
        });
});

        // Ensamblar controles de imagen
        imgPreviewContainer.appendChild(imgPreview);
        fileInputContainer.appendChild(fileInput);
        fileInputContainer.appendChild(fileInputLabel);
        
        imagenControls.appendChild(imgPreviewContainer);
        imagenControls.appendChild(fileInputContainer);
        
        imagenSection.appendChild(labelImg);
        imagenSection.appendChild(imagenControls);

        // Platillos (lista)
        const labelPlat = document.createElement("label");
        labelPlat.textContent = "Platillos (separados por coma)";
        labelPlat.htmlFor = `platillos-${idx}`;
        
        const textareaPlat = document.createElement("textarea");
        textareaPlat.id = `platillos-${idx}`;
        textareaPlat.value = dia.platillos.join(", ");
        textareaPlat.dataset.tipo = "menu";
        textareaPlat.dataset.index = idx;
        textareaPlat.dataset.campo = "platillos";
        textareaPlat.placeholder = "Ej: Sopa de verduras, Pollo asado, Arroz blanco";

        // Añadir todos los elementos al contenedor del día
        div.appendChild(labelDia);
        div.appendChild(selectDia);
        div.appendChild(labelFecha);
        div.appendChild(inputFecha);
        div.appendChild(imagenSection);
        div.appendChild(inputImg); // Input oculto
        div.appendChild(labelPlat);
        div.appendChild(textareaPlat);

        container.appendChild(div);
    });
}

// ------------------ Guardar Cambios ------------------
function guardarCambios() {
    console.log('💾 INICIANDO GUARDADO - VERIFICANDO CAMBIOS...');
    
    // ✅ 1. CREAR COPIA DE LOS DATOS ACTUALES PARA COMPARAR
    const datosOriginales = JSON.parse(JSON.stringify(datosMenu));
    
    // ✅ 2. ACTUALIZAR datosMenu CON LOS VALORES ACTUALES
    console.log('🔄 Sincronizando formularios con datos en memoria...');
    
    // Actualizar CARTA
    let cambiosCarta = false;
    document.querySelectorAll("#cartaContainer input, #cartaContainer textarea").forEach(input => {
        const tipo = input.dataset.tipo;
        const idx = parseInt(input.dataset.index);
        const campo = input.dataset.campo;
        const valor = input.value.trim();

        if (tipo === "carta" && datosMenu.carta && datosMenu.carta[idx]) {
            const valorOriginal = campo === "pago_mensaje" ? datosMenu.carta[idx].pago.mensaje :
                               campo === "pago_banco" ? datosMenu.carta[idx].pago.banco :
                               datosMenu.carta[idx][campo];
            
            if (valor !== valorOriginal) {
                cambiosCarta = true;
                console.log(`🔄 CAMBIO DETECTADO - Carta[${idx}].${campo}: "${valorOriginal}" → "${valor}"`);
            }

            if (campo === "pago_mensaje") {
                datosMenu.carta[idx].pago.mensaje = valor;
            } else if (campo === "pago_banco") {
                datosMenu.carta[idx].pago.banco = valor;
            } else {
                datosMenu.carta[idx][campo] = valor;
            }
        }
    });

    // Actualizar MENÚ SEMANAL
    let cambiosMenu = false;
    document.querySelectorAll("#menuContainer input, #menuContainer textarea, #menuContainer select").forEach(input => {
        const tipo = input.dataset.tipo;
        const idx = parseInt(input.dataset.index);
        const campo = input.dataset.campo;
        let valor = input.value.trim();

        if (tipo === "menu" && datosMenu.menu_semana && datosMenu.menu_semana[idx]) {
            let valorOriginal;
            
            if (campo === "platillos") {
                valorOriginal = datosMenu.menu_semana[idx][campo].join(", ");
                const platillosLimpos = valor.split(",").map(p => p.trim()).filter(p => p !== "");
                
                if (JSON.stringify(platillosLimpos) !== JSON.stringify(datosMenu.menu_semana[idx][campo])) {
                    cambiosMenu = true;
                    console.log(`🔄 CAMBIO DETECTADO - Menu[${idx}].${campo}:`, datosMenu.menu_semana[idx][campo], "→", platillosLimpos);
                }
                
                datosMenu.menu_semana[idx][campo] = platillosLimpos;
            } else {
                valorOriginal = datosMenu.menu_semana[idx][campo];
                
                if (valor !== valorOriginal) {
                    cambiosMenu = true;
                    console.log(`🔄 CAMBIO DETECTADO - Menu[${idx}].${campo}: "${valorOriginal}" → "${valor}"`);
                }
                
                datosMenu.menu_semana[idx][campo] = valor;
            }
        }
    });

    // ✅ 3. VERIFICAR SI REALMENTE HAY CAMBIOS
    const hayCambiosReales = cambiosCarta || cambiosMenu;
    
    if (!hayCambiosReales) {
        console.log('ℹ️  No se detectaron cambios reales en los datos');
        alert('ℹ️  No se detectaron cambios para guardar');
        return;
    }

    console.log('✅ CAMBIOS DETECTADOS - Procediendo a guardar...');
    console.log('📊 DATOS ACTUALIZADOS:', JSON.stringify(datosMenu, null, 2));

    // Mostrar indicador de carga
    const btnGuardar = document.querySelector('button[type="submit"]');
    const textoOriginal = btnGuardar ? btnGuardar.textContent : "";
    if (btnGuardar) {
        btnGuardar.textContent = "Guardando...";
        btnGuardar.disabled = true;
    }

    // ✅ ENVIAR datosMenu ACTUALIZADO al servidor
    fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosMenu),
        credentials: 'include'
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            return res.text();
        })
        .then(msg => {
            console.log("✅ Respuesta del servidor:", msg);
            alert("✅ " + msg);
            
            // Recargar datos para confirmar
            setTimeout(() => {
                fetch("/api/menu")
                    .then(res => res.json())
                    .then(data => {
                        datosMenu = data;
                        console.log("🔄 Datos recargados después de guardar");
                    })
                    .catch(err => console.error("Error recargando datos:", err));
            }, 1000);
        })
        .catch(err => {
            console.error("Error guardando:", err);
            alert("❌ Error al guardar los cambios: " + err.message);
        })
        .finally(() => {
            if (btnGuardar) {
                btnGuardar.textContent = textoOriginal || "Guardar";
                btnGuardar.disabled = false;
            }
        });
}

// Guardar cambios automáticamente después de subir imagen
function guardarCambiosAutomaticos() {
    console.log('💾 GUARDADO AUTOMÁTICO - Imagen subida, guardando cambios...');
    
    // ✅ VERIFICAR QUE datosMenu ESTÉ ACTUALIZADO
    if (!datosMenu || !datosMenu.menu_semana) {
        console.error('❌ datosMenu no está disponible para guardar');
        return;
    }
    
    console.log('📊 Enviando datos actualizados:', JSON.stringify(datosMenu, null, 2));
    
    fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosMenu),
        credentials: 'include'
    })
    .then(res => res.text())
    .then(msg => {
        console.log("✅ Cambios automáticos guardados:", msg);
    })
    .catch(err => {
        console.error("❌ Error guardando cambios automáticos:", err);
    });
}

// ------------------ Botón de Sincronización ------------------
function addSyncButton() {
    const menuForm = document.getElementById("menuForm");
    if (!menuForm) return;
    
    // ✅ TRANSFORMAR el botón existente en nuestro botón único
    const existingButton = menuForm.querySelector('button[type="submit"]');
    
    if (existingButton) {
        // Configurar el botón único
        existingButton.type = "button"; // Cambiar de submit a button
        existingButton.id = "syncButton";
        existingButton.textContent = "🚀 Sincronizar Cambios con Producción";
        existingButton.style.marginTop = "2rem";
        existingButton.style.padding = "1.2rem 2.5rem";
        existingButton.style.background = "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)";
        existingButton.style.color = "white";
        existingButton.style.border = "none";
        existingButton.style.borderRadius = "12px";
        existingButton.style.cursor = "pointer";
        existingButton.style.fontSize = "1.2rem";
        existingButton.style.fontWeight = "600";
        existingButton.style.width = "100%";
        existingButton.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
        
        // ✅ ASIGNAR LA FUNCIÓN UNIFICADA
        existingButton.onclick = synchronizeAllChanges;
    }
}

// ------------------ FUNCIÓN ÚNICA PARA TODO ------------------
function synchronizeAllChanges() {
    console.log('🚀 INICIANDO PROCESO COMPLETO...');
    
    const syncButton = document.getElementById("syncButton");
    const originalText = syncButton.textContent;
    
    // ✅ 1. DESHABILITAR BOTÓN INMEDIATAMENTE
    syncButton.disabled = true;
    syncButton.textContent = "⏳ Guardando cambios locales...";
    
    // ✅ 2. PRIMERO GUARDAR CAMBIOS LOCALES (texto, fechas, etc.)
    guardarCambiosLocales()
        .then(() => {
            // ✅ 3. SI EL GUARDADO LOCAL ES EXITOSO, PROCEDER CON SINCRONIZACIÓN
            syncButton.textContent = "🔄 Sincronizando con producción...";
            return synchronizeWithProduction();
        })
        .then(() => {
            // ✅ 4. TODO COMPLETADO EXITOSAMENTE
            console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
        })
        .catch(error => {
            // ✅ 5. MANEJO DE ERRORES
            console.error('❌ Error en el proceso:', error);
            alert('❌ Error: ' + error.message);
        })
        .finally(() => {
            // ✅ 6. RESTAURAR BOTÓN
            syncButton.textContent = originalText;
            syncButton.disabled = false;
        });
}

// ------------------ GUARDAR CAMBIOS LOCALES ------------------
function guardarCambiosLocales() {
    return new Promise((resolve, reject) => {
        console.log('💾 GUARDANDO CAMBIOS LOCALES...');
        
        // ✅ CAPTURAR DATOS ACTUALES DE LOS FORMULARIOS
        const datosActualizados = {
            carta: [],
            menu_semana: []
        };

        // CAPTURAR CARTA ACTUAL
        document.querySelectorAll("#cartaContainer .hoja").forEach((hoja, idx) => {
            const item = {
                nombre: hoja.querySelector(`input[data-campo="nombre"]`)?.value || "",
                descripcion: hoja.querySelector(`textarea[data-campo="descripcion"]`)?.value || "",
                precio: hoja.querySelector(`input[data-campo="precio"]`)?.value || "",
                tituloCarta: hoja.querySelector(`input[data-campo="tituloCarta"]`)?.value || "",
                pagina4: hoja.querySelector(`textarea[data-campo="pagina4"]`)?.value || "",
                pago: {
                    mensaje: hoja.querySelector(`input[data-campo="pago_mensaje"]`)?.value || "",
                    banco: hoja.querySelector(`input[data-campo="pago_banco"]`)?.value || ""
                }
            };
            datosActualizados.carta.push(item);
        });

        // CAPTURAR MENÚ SEMANAL ACTUAL
        document.querySelectorAll("#menuContainer .dia").forEach((diaElem, idx) => {
            const platillosText = diaElem.querySelector(`textarea[data-campo="platillos"]`)?.value || "";
            const platillosArray = platillosText.split(",").map(p => p.trim()).filter(p => p !== "");
            
            const dia = {
                dia: diaElem.querySelector(`select[data-campo="dia"]`)?.value || "",
                fecha: diaElem.querySelector(`input[data-campo="fecha"]`)?.value || "",
                imagen: diaElem.querySelector(`input.hidden-image-input`)?.value || "",
                platillos: platillosArray
            };
            datosActualizados.menu_semana.push(dia);
        });

        console.log('📊 DATOS A GUARDAR:', JSON.stringify(datosActualizados, null, 2));

        // ✅ COMPARAR CON DATOS ORIGINALES
        const hayCambios = JSON.stringify(datosActualizados) !== JSON.stringify(datosMenu);
        
        if (!hayCambios) {
            console.log('ℹ️  No hay cambios locales para guardar');
            resolve(); // Resolvemos igual para continuar con la sincronización
            return;
        }

        // ✅ ACTUALIZAR datosMenu EN MEMORIA
        datosMenu = datosActualizados;

        // ✅ ENVIAR AL SERVIDOR
        fetch("/api/menu", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: JSON.stringify(datosActualizados),
            credentials: 'include'
        })
        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error ${res.status}: ${errorText}`);
            }
            return res.text();
        })
        .then(msg => {
            console.log("✅ Cambios locales guardados:", msg);
            resolve(); // ✅ ÉXITO - continuar con sincronización
        })
        .catch(err => {
            console.error("❌ Error guardando cambios locales:", err);
            reject(new Error("No se pudieron guardar los cambios locales: " + err.message));
        });
    });
}

// ------------------ SINCRONIZAR CON PRODUCCIÓN ------------------
function synchronizeWithProduction() {
    return new Promise((resolve, reject) => {
        console.log('🌐 INICIANDO SINCRONIZACIÓN CON PRODUCCIÓN...');
        
        // ✅ CREAR OVERLAY DE CARGA
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "10000";
        overlay.style.color = "white";
        overlay.style.fontSize = "1.2rem";
        
        // ✅ CONTENEDOR DE PROGRESO
        const progressContainer = document.createElement("div");
        progressContainer.style.width = "80%";
        progressContainer.style.maxWidth = "500px";
        progressContainer.style.textAlign = "center";
        
        // ✅ BARRA DE PROGRESO
        const progressBar = document.createElement("div");
        progressBar.style.width = "100%";
        progressBar.style.height = "20px";
        progressBar.style.backgroundColor = "#333";
        progressBar.style.borderRadius = "10px";
        progressBar.style.margin = "20px 0";
        progressBar.style.overflow = "hidden";
        
        const progressFill = document.createElement("div");
        progressFill.style.width = "0%";
        progressFill.style.height = "100%";
        progressFill.style.backgroundColor = "#4CAF50";
        progressFill.style.transition = "width 0.3s ease";
        progressFill.style.borderRadius = "10px";
        
        progressBar.appendChild(progressFill);
        
        // ✅ TEXTO DE PROGRESO
        const progressText = document.createElement("div");
        progressText.textContent = "0% - Iniciando sincronización...";
        progressText.style.marginBottom = "10px";
        
        // ✅ ENSAMBLAR OVERLAY
        progressContainer.appendChild(progressText);
        progressContainer.appendChild(progressBar);
        overlay.appendChild(progressContainer);
        document.body.appendChild(overlay);
        
        // ✅ SIMULAR PROGRESO
        let progress = 0;
        const totalTime = 180; // 3 minutos en segundos
        const interval = setInterval(() => {
            progress += (100 / totalTime);
            if (progress > 95) progress = 95; // Máximo 95% hasta que termine
            
            progressFill.style.width = progress + "%";
            progressText.textContent = Math.round(progress) + "% - Sincronizando con producción...";
        }, 1000);
        
        // ✅ HACER PETICIÓN REAL
        fetch("/api/sync-production", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            clearInterval(interval);
            progressFill.style.width = "100%";
            progressText.textContent = "100% - ¡Completado!";
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                
                if (data.success) {
                    console.log("✅ Sincronización exitosa:", data.message);
                    alert("✅ " + data.message + "\n\nTodos los cambios han sido aplicados en el sitio público.");
                    resolve(); // ✅ ÉXITO
                } else {
                    reject(new Error(data.message || "Error en sincronización"));
                }
            }, 2000);
        })
        .catch(error => {
            clearInterval(interval);
            document.body.removeChild(overlay);
            console.error("❌ Error en sincronización:", error);
            reject(new Error("Error de conexión: " + error.message));
        });
    });
}


// Añadir el botón cuando se cargue el DOM
addSyncButton();
