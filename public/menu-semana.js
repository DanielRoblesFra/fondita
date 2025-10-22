document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("menuSemanaContainer");

    // Para el archivo autónomo, usar los datos embebidos
    if (typeof menuData !== 'undefined') {
        renderMenu(menuData.menu_semana);
    } else {
        // Fallback: cargar desde API
        fetch("/api/menu")
            .then(res => res.json())
            .then(data => renderMenu(data.menu_semana))
            .catch(err => {
                console.error("Error cargando menú semanal:", err);
                // Último recurso: datos por defecto
                renderMenu([]);
            });
    }

    function renderMenu(menu_semana) {
        container.innerHTML = "";

        if (!menu_semana || menu_semana.length === 0) {
            container.innerHTML = '<p class="no-menu">No hay menú disponible</p>';
            return;
        }

        menu_semana.forEach(dia => {
            // Solo mostrar días que tengan platillos o imagen
            if ((dia.platillos && dia.platillos.length > 0) || dia.imagen) {
                const card = document.createElement("div");
                card.className = "card";
                
                // Agregar clase especial para Ensaladas y Promociones (SOLO EN PRODUCCIÓN)
                if (dia.dia === "Ensaladas" || dia.dia === "Promociones de temporada") {
                    card.classList.add("card-especial");
                }
                
                card.innerHTML = `
                    <div class="card-inner">
                        <div class="card-front">
                            <h1>${dia.dia}</h1>
                            ${dia.fecha ? `<p>${dia.fecha}</p>` : ''}
                            ${(dia.dia === "Ensaladas" || dia.dia === "Promociones de temporada") ? 
                              `<small class="badge-especial">${dia.dia.includes('Ensaladas') ? '🥗' : '🔥'} Especial</small>` : ''}
                        </div>
                        <div class="card-back">
                            ${dia.imagen ? `<img src="img/${dia.imagen}" alt="${dia.dia}" class="dish-image">` : ''}
                            ${dia.platillos && dia.platillos.length > 0 ? `
                                <ul class="menu-list">
                                    ${dia.platillos.map(p => `<li>${p}</li>`).join("")}
                                </ul>
                            ` : '<p class="no-platillos">Próximamente...</p>'}
                        </div>
                    </div>
                `;

                container.appendChild(card);
            }
        });
    }
});
