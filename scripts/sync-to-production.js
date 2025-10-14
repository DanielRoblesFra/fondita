// sync-to-production.js - VERSIÓN OPTIMIZADA (MANTIENE INDEPENDENCIA)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO SINCRONIZACIÓN RÁPIDA...');

const PROD_REPO_DIR = path.join(__dirname, '..', 'production-repo');
const AUTH_REPO_URL = `https://DanielRoblesFra:${process.env.GH_TOKEN}@github.com/DanielRoblesFra/fondita-production.git`;

try {
    // 1. Actualizar o clonar repo de producción
    if (!fs.existsSync(PROD_REPO_DIR)) {
        console.log('📦 Clonando repositorio de producción...');
        execSync(`git clone ${AUTH_REPO_URL} ${PROD_REPO_DIR}`, { stdio: 'inherit' });
    } else {
        console.log('📥 Actualizando repositorio existente...');
        execSync(`cd ${PROD_REPO_DIR} && git fetch origin && git reset --hard origin/main`, { stdio: 'inherit' });
    }

    // 2. Cargar datos ACTUALES del menú
    console.log('📊 Cargando datos del menú...');
    const menuData = JSON.parse(fs.readFileSync(
        path.join(__dirname, '..', 'data', 'menu.json'), 
        'utf8'
    ));

    // 3. CREAR ARCHIVOS AUTÓNOMOS (INDEPENDIENTES DE RENDER)
    console.log('📝 Generando archivos autónomos...');
    
    // ✅ la-carta.js - COMPLETAMENTE AUTÓNOMO
    const laCartaContent = `
// ARCHIVO AUTÓNOMO - NO DEPENDE DE RENDER
let currentPage = 0;
const container = document.getElementById("bookContainer");
let pages = [];

// DATOS EMBEBIDOS - NO HACE FETCH
const menuData = ${JSON.stringify(menuData, null, 2)};

function cargarCarta() {
    if (!container) return;
    container.innerHTML = "";
    
    if (menuData.carta && menuData.carta.length > 0) {
        const platillo = menuData.carta[0];
        const tituloCarta = platillo.tituloCarta || "Carta del día";
        const textoPagina4 = platillo.pagina4 || 'Información adicional del restaurante';
        
        // Páginas del libro CON DATOS ACTUALES
        const pagesHTML = [
            '<div class="content"><h2>' + tituloCarta + '</h2><img src="img/logo.png" alt="Logo Restaurante" class="page-image"><p>' + (platillo.nombre || '') + '</p><div class="back"></div></div>',
            '<div class="content"><h2>' + (platillo.nombre || '') + '</h2><p>' + (platillo.descripcion || '') + '</p><div class="back"></div></div>',
            '<div class="content"><p>Costo del platillo: ' + (platillo.precio || '') + '</p><p>' + (platillo.pago?.mensaje || '') + '</p><p>' + (platillo.pago?.banco || '') + '</p><div class="back"></div></div>',
            '<div class="content"><p>' + textoPagina4 + '</p><div class="back"></div></div>'
        ];
        
        pagesHTML.forEach(html => {
            const page = document.createElement("div");
            page.className = "page";
            page.innerHTML = html;
            container.appendChild(page);
        });

        pages = document.querySelectorAll('.page');
    }
}

function flipPage(){
    if(currentPage < pages.length){
        pages[currentPage].classList.add("flipped");
        currentPage++;
    } else {
        pages.forEach(p => p.classList.remove("flipped"));
        currentPage = 0;
    }
}

// Cargar automáticamente al iniciar
document.addEventListener("DOMContentLoaded", cargarCarta);
`;

    // ✅ menu-semana.js - COMPLETAMENTE AUTÓNOMO  
    const menuSemanaContent = `
// ARCHIVO AUTÓNOMO - NO DEPENDE DE RENDER
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("menuSemanaContainer");
    
    // DATOS EMBEBIDOS - NO HACE FETCH
    const menuData = ${JSON.stringify(menuData, null, 2)};

    if (container && menuData.menu_semana) {
        container.innerHTML = "";
        menuData.menu_semana.forEach(dia => {
            if (!dia.dia) return;
            
            const platillosHTML = dia.platillos 
                ? dia.platillos.map(p => '<li>' + p + '</li>').join("")
                : "";
                
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = '<div class="card-inner"><div class="card-front"><h1>' + dia.dia + '</h1><p>' + (dia.fecha || '') + '</p></div><div class="card-back"><img src="img/' + (dia.imagen || 'default.jpg') + '" alt="' + dia.dia + '" class="dish-image"><ul class="menu-list">' + platillosHTML + '</ul></div></div>';
            container.appendChild(card);
        });
    }
});
`;

    // 4. GUARDAR ARCHIVOS AUTÓNOMOS
    fs.writeFileSync(path.join(PROD_REPO_DIR, 'la-carta.js'), laCartaContent, 'utf8');
    fs.writeFileSync(path.join(PROD_REPO_DIR, 'menu-semana.js'), menuSemanaContent, 'utf8');
    console.log('✅ Archivos autónomos creados');

    // 5. COPIAR ARCHIVOS ESTÁTICOS ESENCIALES
    console.log('📄 Copiando archivos estáticos...');
    const filesToCopy = [
        { src: 'public/index.html', dest: 'index.html' },
        { src: 'public/estilos.css', dest: 'estilos.css' },
        { src: 'public/menu.js', dest: 'menu.js' },
        { src: 'public/preguntas.js', dest: 'preguntas.js' },
        { src: 'public/scoll.js', dest: 'scoll.js' },
        { src: 'data/menu.json', dest: 'menu.json' } // COPIA de respaldo
    ];

    for (const file of filesToCopy) {
        const srcPath = path.join(__dirname, '..', file.src);
        const destPath = path.join(PROD_REPO_DIR, file.dest);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log('✅ Copiado: ' + file.src);
        }
    }

    // 6. COPIAR IMÁGENES DE FORMA INTELIGENTE
    console.log('🖼️ Sincronizando imágenes...');
    const srcImgDir = path.join(__dirname, '..', 'img');
    const destImgDir = path.join(PROD_REPO_DIR, 'img');

    if (!fs.existsSync(destImgDir)) {
        fs.mkdirSync(destImgDir, { recursive: true });
    }

    if (fs.existsSync(srcImgDir)) {
        const images = fs.readdirSync(srcImgDir);
        let copiedCount = 0;
        
        for (const image of images) {
            if (/\.(jpg|jpeg|png)$/i.test(image)) {
                fs.copyFileSync(
                    path.join(srcImgDir, image), 
                    path.join(destImgDir, image)
                );
                copiedCount++;
            }
        }
        console.log(`✅ ${copiedCount} imágenes sincronizadas`);
    }

    // 7. ELIMINAR IMÁGENES HUÉRFANAS (MANTIENE LIMPIO)
    console.log('🧹 Limpiando imágenes no utilizadas...');
    if (fs.existsSync(destImgDir)) {
        const prodImages = fs.readdirSync(destImgDir);
        const usedImages = new Set();
        
        // Imágenes usadas en el menú semanal
        if (menuData.menu_semana) {
            menuData.menu_semana.forEach(dia => {
                if (dia.imagen) usedImages.add(dia.imagen);
            });
        }
        
        // Imágenes fijas que siempre se mantienen
        usedImages.add('logo.png');
        usedImages.add('portada-login.jpg');
        usedImages.add('portada.avif');
        
        let deletedCount = 0;
        prodImages.forEach(image => {
            if (!usedImages.has(image) && /\.(jpg|jpeg|png)$/i.test(image)) {
                try {
                    fs.unlinkSync(path.join(destImgDir, image));
                    console.log('🗑️ Eliminada: ' + image);
                    deletedCount++;
                } catch (error) {
                    console.log('⚠️ No se pudo eliminar: ' + image);
                }
            }
        });
        
        if (deletedCount > 0) {
            console.log(`🧹 ${deletedCount} imágenes huérfanas eliminadas`);
        }
    }

    // 8. COMMIT Y PUSH
    console.log('💾 Haciendo commit de los cambios...');
    execSync(`cd ${PROD_REPO_DIR} && git add -A`, { stdio: 'inherit' });
    
    const status = execSync(`cd ${PROD_REPO_DIR} && git status --porcelain`).toString();
    
    if (status.trim() !== '') {
        const commitMessage = `Actualización automática: ${new Date().toLocaleString('es-MX')}`;
        execSync(`cd ${PROD_REPO_DIR} && git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        execSync(`cd ${PROD_REPO_DIR} && git push`, { stdio: 'inherit' });
        console.log('✅ Sincronización completada con éxito!');
    } else {
        console.log('✅ No hay cambios - ya está sincronizado');
    }

} catch (error) {
    console.error('❌ Error en sincronización:', error.message);
    process.exit(1);
}
