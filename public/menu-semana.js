document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menuSemanaContainer"); // Contenedor de las cards

    fetch("/api/menu")
        .then(res => res.json())
        .then(data => {
        container.innerHTML = "";

        data.menu_semana.forEach(dia => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                <h1>${dia.dia}</h1>
                <p>${dia.fecha}</p>
                </div>
                <div class="card-back">
                <img src="img/${dia.imagen}" alt="${dia.dia}" class="dish-image">
                <ul class="menu-list">
                    ${dia.platillos.map(p => `<li>${p}</li>`).join("")}
                </ul>
                </div>
            </div>
            `;

            container.appendChild(card);
        });
        })
        .catch(err => console.error("Error cargando menú semanal:", err));
});
