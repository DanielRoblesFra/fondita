// admin.js
let datosMenu = {};

// 🎯 FEATURE FLAGS SYSTEM - CONTROL TOTAL (AGREGAR ESTO)
const FEATURE_FLAGS = {
    PAGINA_4: false  // 🔘 FALSE = Oculto para usuarios normales
};

// 🕵️‍♂️ DETECTAR SI ERES ADMINISTRADOR 
function esAdministrador() {
    return window.location.pathname.includes('/admin') || 
           window.location.href.includes('?debug=true');
}

// 🔓 OBTENER ESTADO REAL DEL FEATURE
function estaActivo(feature) {
    const valorBase = FEATURE_FLAGS[feature];
    
    // Si eres admin, puedes ver features aunque estén desactivados
    if (esAdministrador()) {
        const urlParams = new URLSearchParams(window.location.search);
        const forzarActivo = urlParams.get(feature);
        
        if (forzarActivo !== null) {
            return forzarActivo === 'true';
        }
        return true; // Admin siempre ve los features
    }
    
    // Para usuarios normales, solo valor base
    return valorBase;
}
// 🎯 FIN DE FEATURE FLAGS - CONTINÚA TU CÓDIGO NORMAL


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

    // Guardar cambios
    document.getElementById("menuForm").addEventListener("submit", e => {
        e.preventDefault();
        guardarCambios();
    });
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
            imgPreview.src = `/img/${dia.imagen}`;
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
                    
                    // Actualizar los datos en memoria
                    datosMenu.menu_semana[idx].imagen = resp.filename;
                    
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
    // ✅ VALIDACIÓN DE CAMPOS OBLIGATORIOS
    const camposVacios = [];
    const todosLosCampos = document.querySelectorAll(
        "#cartaContainer input[required], #cartaContainer textarea[required], #menuContainer input[required], #menuContainer textarea[required], #menuContainer select[required]"
    );
    
    todosLosCampos.forEach((campo, index) => {
        const valor = campo.value.trim();
        
        if (!valor || valor === "") {
            campo.style.borderColor = "#e74c3c";
            campo.style.backgroundColor = "#fdf2f2";
            
            const label = campo.previousElementSibling;
            const nombreCampo = label ? label.textContent : `Campo ${index + 1}`;
            camposVacios.push(nombreCampo);
        } else {
            campo.style.borderColor = "#ddd";
            campo.style.backgroundColor = "#fff";
        }
    });

    if (camposVacios.length > 0) {
        alert(`❌ Por favor completa todos los campos obligatorios:\n\n${camposVacios.join('\n')}`);
        const primerCampoVacio = document.querySelector(
            "#cartaContainer input[required], #cartaContainer textarea[required], #menuContainer input[required], #menuContainer textarea[required], #menuContainer select[required]"
        );
        if (primerCampoVacio && primerCampoVacio.style.borderColor === "rgb(231, 76, 60)") {
            primerCampoVacio.scrollIntoView({ behavior: 'smooth', block: 'center' });
            primerCampoVacio.focus();
        }
        return;
    }

    // ✅ Si todos los campos están llenos, proceder a guardar
    document.querySelectorAll("#cartaContainer input, #cartaContainer textarea, #menuContainer input, #menuContainer textarea, #menuContainer select")
        .forEach(input => {
            const tipo = input.dataset.tipo;
            const idx = input.dataset.index;
            const campo = input.dataset.campo;
            let valor = input.value.trim();

            if (tipo === "carta") {
                if (campo === "pago_mensaje") datosMenu.carta[idx].pago.mensaje = valor;
                else if (campo === "pago_banco") datosMenu.carta[idx].pago.banco = valor;
                else datosMenu.carta[idx][campo] = valor;
            } else if (tipo === "menu") {
                if (campo === "platillos") {
                    const platillosLimpos = valor.split(",")
                        .map(p => p.trim())
                        .filter(p => p !== "");
                    datosMenu.menu_semana[idx][campo] = platillosLimpos;
                } else {
                    datosMenu.menu_semana[idx][campo] = valor;
                }
            }
        });

    // Mostrar indicador de carga
    const btnGuardar = document.querySelector('button[type="submit"]');
    const textoOriginal = btnGuardar ? btnGuardar.textContent : "";
    if (btnGuardar) {
        btnGuardar.textContent = "Guardando...";
        btnGuardar.disabled = true;
    }

    fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosMenu),
        credentials: 'include'
    })
        .then(res => res.text())
        .then(msg => {
            alert("✅ " + msg);
            console.log("✅ Datos guardados correctamente");
        })
        .catch(err => {
            console.error("Error guardando:", err);
            alert("❌ Error al guardar los cambios. Intenta nuevamente.");
        })
        .finally(() => {
            if (btnGuardar) {
                btnGuardar.textContent = textoOriginal || "Guardar";
                btnGuardar.disabled = false;
            }
        });
}

// ------------------ Botón de Sincronización ------------------
function addSyncButton() {
    const menuForm = document.getElementById("menuForm");
    if (!menuForm) return;
    
    const syncButton = document.createElement("button");
    syncButton.type = "button";
    syncButton.id = "syncButton";
    syncButton.textContent = "🔄 Sincronizar con Producción";
    syncButton.style.marginTop = "1rem";
    syncButton.style.marginRight = "1rem";
    syncButton.style.padding = "1rem 2rem";
    syncButton.style.background = "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)";
    syncButton.style.color = "white";
    syncButton.style.border = "none";
    syncButton.style.borderRadius = "12px";
    syncButton.style.cursor = "pointer";
    syncButton.style.fontSize = "1.1rem";
    syncButton.style.fontWeight = "600";
    
    syncButton.addEventListener("click", synchronizeWithProduction);
    
    // Insertar antes del botón de guardar
    const submitButton = menuForm.querySelector('button[type="submit"]');
    menuForm.insertBefore(syncButton, submitButton);
}

    // ------------------ Función de Sincronización ------------------
    function synchronizeWithProduction() {
    const syncButton = document.getElementById("syncButton");
    const originalText = syncButton.textContent;
    
    syncButton.textContent = "⏳ Sincronizando...";
    syncButton.disabled = true;
    
    fetch("/api/sync-production", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
        alert("✅ " + data.message);
        console.log("✅ Sincronización exitosa");
        } else {
        alert("❌ " + data.message);
        console.error("❌ Error en sincronización:", data.message);
        }
    })
    .catch(error => {
        console.error("Error en sincronización:", error);
        alert("❌ Error de conexión al sincronizar");
    })
    .finally(() => {
        syncButton.textContent = originalText;
        syncButton.disabled = false;
    });
}

// Añadir el botón cuando se cargue el DOM
addSyncButton();
