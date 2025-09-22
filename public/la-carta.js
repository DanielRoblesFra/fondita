let currentPage = 0;
const container = document.getElementById("bookContainer"); // Contenedor del book
let pages = [];

// Función para crear las páginas dinámicamente desde la API
function cargarCarta() {
    fetch("/api/menu")
        .then(res => res.json())
        .then(data => {
        container.innerHTML = "";
        data.carta.forEach(platillo => {
            // Página 1
            const page1 = document.createElement("div");
            page1.className = "page";
            page1.innerHTML = `
            <div class="content">
                <h2>Carta del día</h2>
                <img src="img/logo.png" alt="Logo Restaurante" class="page-image">
                <p>${platillo.nombre}</p>
                <div class="back"></div>
            </div>
            `;

            // Página 2
            const page2 = document.createElement("div");
            page2.className = "page";
            page2.innerHTML = `
            <div class="content">
                <h2>${platillo.nombre}</h2>
                <p>${platillo.descripcion}</p>
                <div class="back"></div>
            </div>
            `;

            // Página 3
            const page3 = document.createElement("div");
            page3.className = "page";
            page3.innerHTML = `
            <div class="content">
                <p>Costo del platillo: ${platillo.precio}</p>
                <p>${platillo.pago.mensaje}</p>
                <p>${platillo.pago.banco}</p>
                <div class="back"></div>
            </div>
            `;

            container.appendChild(page1);
            container.appendChild(page2);
            container.appendChild(page3);
        });

        // Actualizar la lista de páginas para flipPage
        pages = document.querySelectorAll('.page');
        })
        .catch(err => console.error("Error cargando carta:", err));
    }

    // Función flipPage (iCambia de pagina con el boton)
    function flipPage(){
        if(currentPage < pages.length){
            pages[currentPage].classList.add("flipped");
            currentPage++;
        } else {
            // Reset book
            pages.forEach(p => p.classList.remove("flipped"));
            currentPage = 0;
        }
    }

    // Cargar la carta al iniciar
    document.addEventListener("DOMContentLoaded", () => {
    cargarCarta();
});
