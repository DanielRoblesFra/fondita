const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROD_REPO_URL = process.env.PROD_REPO_URL;
const GH_TOKEN = process.env.GH_TOKEN;
const PROD_REPO_DIR = path.join(__dirname, '..', 'production-repo');
const BRANCH = 'main';

console.log('🔄 Iniciando sincronización completa...');

try {
    // ✅ EXCLUIR production-repo DE GIT EN EL REPOSITORIO PRINCIPAL
    try {
        const gitignorePath = path.join(__dirname, '..', '.gitignore');
        let gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
        
        if (!gitignoreContent.includes('production-repo')) {
            gitignoreContent += '\nproduction-repo/\n';
            fs.writeFileSync(gitignorePath, gitignoreContent);
            console.log('✅ production-repo agregado a .gitignore');
        }
    } catch (error) {
        console.log('⚠️ No se pudo actualizar .gitignore:', error.message);
    }

    // ✅ CONFIGURAR GIT EN RENDER (SOLUCIÓN AL ERROR)
    try {
        execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
        execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
        console.log('✅ Configuración de Git establecida');
    } catch (error) {
        console.log('⚠️ Error en configuración Git:', error.message);
    }

    // ✅ PRIMERO: Guardar cambios en repositorio principal
    console.log('💾 Guardando cambios en repositorio principal...');
    try {
        execSync('node scripts/force-commit.js', { stdio: 'inherit' });
    } catch (error) {
        console.log('⚠️ Continue despite commit errors');
    }

    // ✅ LUEGO: Continuar con la sincronización normal
    const repoMatch = PROD_REPO_URL.match(/github\.com\/([^\/]+)\/([^\.]+)/);
    const GIT_USERNAME = repoMatch ? repoMatch[1] : '';
    const REPO_NAME = repoMatch ? repoMatch[2] : '';
    const AUTH_REPO_URL = `https://${GIT_USERNAME}:${GH_TOKEN}@github.com/${GIT_USERNAME}/${REPO_NAME}.git`;

    // Generar timestamp único para cache busting
    const CACHE_BUST_TIMESTAMP = new Date().getTime();
    console.log(`⏰ Timestamp para cache busting: ${CACHE_BUST_TIMESTAMP}`);

    // Clonar o actualizar el repositorio de producción
    if (!fs.existsSync(PROD_REPO_DIR)) {
        console.log('📦 Clonando repositorio de producción...');
        execSync(`git clone ${AUTH_REPO_URL} ${PROD_REPO_DIR}`, { stdio: 'inherit' });
    } else {
        console.log('📥 Actualizando repositorio existente...');
        execSync(`cd ${PROD_REPO_DIR} && git fetch origin && git reset --hard origin/${BRANCH}`, { stdio: 'inherit' });
    }

    // Configurar Git para commits en el repo de producción
    execSync(`cd ${PROD_REPO_DIR} && git config user.email "render@fondita.com"`, { stdio: 'inherit' });
    execSync(`cd ${PROD_REPO_DIR} && git config user.name "Render Bot"`, { stdio: 'inherit' });

    console.log('🗂️ Copiando archivos estáticos...');

    // Archivos a copiar
    const filesToCopy = [
        { src: 'public/index.html', dest: 'index.html' },
        { src: 'public/estilos.css', dest: 'estilos.css' },
         { src: 'public/menu.js', dest: 'menu.js' },
        { src: 'public/preguntas.js', dest: 'preguntas.js' },
        { src: 'public/scoll.js', dest: 'scoll.js' }
    ];

    // Crear directorios necesarios
    if (!fs.existsSync(path.join(PROD_REPO_DIR, 'img'))) {
        fs.mkdirSync(path.join(PROD_REPO_DIR, 'img'));
    }

    // ✅ NUEVO: Leer los datos del menú actual
    const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
    const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    console.log('📊 Datos del menú cargados correctamente');

    // ✅ NUEVO: Función para crear la-carta.js AUTÓNOMO
function createAutonomousLaCarta() {
    return `// ✅ VERSIÓN AUTÓNOMA - 4 PÁGINAS
let currentPage = 0;
const container = document.getElementById("bookContainer");
let pages = [];

// Datos embebidos directamente
const menuData = ${JSON.stringify(menuData, null, 2)};

function cargarCarta() {
    container.innerHTML = "";
    
    if (menuData.carta && menuData.carta.length > 0) {
        const platillo = menuData.carta[0];
        
        // Página 1 (existente)
        const page1 = document.createElement("div");
        page1.className = "page";
        const tituloCarta = platillo.tituloCarta || "Carta del día";
        page1.innerHTML = '<div class="content"><h2>' + tituloCarta + '</h2><img src="img/logo.png" alt="Logo Restaurante" class="page-image"><p>' + platillo.nombre + '</p><div class="back"></div></div>';

        // Página 2 (existente)
        const page2 = document.createElement("div");
        page2.className = "page";
        page2.innerHTML = '<div class="content"><h2>' + platillo.nombre + '</h2><p>' + platillo.descripcion + '</p><div class="back"></div></div>';

        // Página 3 (existente)
        const page3 = document.createElement("div");
        page3.className = "page";
        page3.innerHTML = '<div class="content"><p>Costo del platillo: ' + platillo.precio + '</p><p>' + platillo.pago.mensaje + '</p><p>' + platillo.pago.banco + '</p><div class="back"></div></div>';

        // PÁGINA 4 
        const page4 = document.createElement("div");
        page4.className = "page";
        const textoPagina4 = platillo.pagina4 || 'Información adicional del restaurante';
        page4.innerHTML = '<div class="content"><p>' + textoPagina4 + '</p><div class="back"></div></div>';

        container.appendChild(page1);
        container.appendChild(page2);
        container.appendChild(page3);
        container.appendChild(page4);

        pages = document.querySelectorAll('.page');
    }
}

// Función flipPage (Cambia de pagina con el boton)
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
`;
}

    // ✅ NUEVO: Función para crear menu-semana.js AUTÓNOMO (VERSIÓN CORREGIDA)
    function createAutonomousMenuSemana() {
        return `// ✅ VERSIÓN AUTÓNOMA - NO DEPENDE DE RENDER
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("menuSemanaContainer");

    // Datos embebidos directamente
    const menuData = ${JSON.stringify(menuData, null, 2)};

    if (container && menuData.menu_semana) {
        container.innerHTML = "";

        menuData.menu_semana.forEach(dia => {
            const card = document.createElement("div");
            card.className = "card";
            
            const platillosHTML = dia.platillos.map(p => '<li>' + p + '</li>').join("");
            
            card.innerHTML = '<div class="card-inner"><div class="card-front"><h1>' + dia.dia + '</h1><p>' + dia.fecha + '</p></div><div class="card-back"><img src="img/' + dia.imagen + '" alt="' + dia.dia + '" class="dish-image"><ul class="menu-list">' + platillosHTML + '</ul></div></div>';

            container.appendChild(card);
        });
    }
});
`;
    }

    // ✅ NUEVO: Función para corregir rutas de imágenes en HTML
    function fixImagePaths(content) {
        // Cambiar rutas absolutas por relativas
        return content
            .replace(/src="\/img\//g, 'src="img/')
            .replace(/src="https:\/\/fondita\.onrender\.com\/img\//g, 'src="img/');
    }

    // ✅ NUEVO: Función para agregar cache busting
    function addCacheBusting(content) {
        return content.replace(/(src|href)=["'](.*?\.(jpg|jpeg|png|gif|svg|webp|avif))(\?v=\d+)?["']/gi, 
            (match, attr, url) => {
                return attr + '="' + url + '?v=' + CACHE_BUST_TIMESTAMP + '"';
            });
    }

    // ✅ NUEVO: Crear archivos AUTÓNOMOS
    console.log('📝 Creando archivos autónomos...');
    
    // Crear la-carta.js autónomo
    const laCartaContent = createAutonomousLaCarta();
    fs.writeFileSync(path.join(PROD_REPO_DIR, 'la-carta.js'), laCartaContent, 'utf8');
    console.log('✅ la-carta.js creado (autónomo)');

    // Crear menu-semana.js autónomo
    const menuSemanaContent = createAutonomousMenuSemana();
    fs.writeFileSync(path.join(PROD_REPO_DIR, 'menu-semana.js'), menuSemanaContent, 'utf8');
    console.log('✅ menu-semana.js creado (autónomo)');

    // Copiar archivos estáticos normales
    for (const file of filesToCopy) {
        const srcPath = path.join(__dirname, '..', file.src);
        const destPath = path.join(PROD_REPO_DIR, file.dest);
        
        if (fs.existsSync(srcPath)) {
            let content = fs.readFileSync(srcPath, 'utf8');
            
            // Corregir rutas en HTML
            if (file.dest === 'index.html') {
                content = fixImagePaths(content);
                content = addCacheBusting(content);
            }
            
            fs.writeFileSync(destPath, content, 'utf8');
            console.log('✅ Copiado: ' + file.src + ' → ' + file.dest);
        } else {
            console.log('⚠️  Advertencia: ' + file.src + ' no existe');
        }
    }

    // Eliminar todas las imágenes existentes primero
    console.log('🗑️ Eliminando imágenes anteriores...');
    const destImgDir = path.join(PROD_REPO_DIR, 'img');
    if (fs.existsSync(destImgDir)) {
        const files = fs.readdirSync(destImgDir);
        for (const file of files) {
            fs.unlinkSync(path.join(destImgDir, file));
            console.log('✅ Eliminada: ' + file);
        }
    }

    // Copiar TODAS las imágenes de la carpeta img
    console.log('🖼️ Copiando todas las imágenes...');
    const srcImgDir = path.join(__dirname, '..', 'img');
    
    if (fs.existsSync(srcImgDir)) {
        const images = fs.readdirSync(srcImgDir);
        
        for (const image of images) {
            const srcPath = path.join(srcImgDir, image);
            const destPath = path.join(destImgDir, image);
            
            if (fs.statSync(srcPath).isFile() && 
                image.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|tiff)$/i)) {
                
                fs.copyFileSync(srcPath, destPath);
                console.log('✅ Copiada imagen: ' + image);
            }
        }
    } else {
        console.log('⚠️  Advertencia: Directorio de imágenes no encontrado');
    }

    // Forzar la detección de cambios y hacer commit
    console.log('💾 Forzando detección de cambios...');
    
    // Usar git add -A para agregar todos los cambios
    execSync('cd ' + PROD_REPO_DIR + ' && git add -A', { stdio: 'inherit' });
    
    // Verificar si hay cambios realmente
    const status = execSync('cd ' + PROD_REPO_DIR + ' && git status --porcelain').toString();
    
    if (status.trim() !== '') {
        console.log('💾 Haciendo commit de los cambios...');
        const commitMessage = 'Actualización automática - Archivos autónomos: ' + new Date().toLocaleString();
        execSync('cd ' + PROD_REPO_DIR + ' && git commit -m "' + commitMessage + '"', { stdio: 'inherit' });

        console.log('🚀 Subiendo cambios al repositorio...');
        // Usar la URL con autenticación para hacer push
        execSync('cd ' + PROD_REPO_DIR + ' && git push ' + AUTH_REPO_URL + ' ' + BRANCH, { stdio: 'inherit' });

        console.log('✅ Sincronización completada con éxito!');
        console.log('🎯 fondita-production ahora es 100% AUTÓNOMO de Render');
    } else {
        console.log('✅ No hay cambios detectados. Todo está actualizado.');
    }
} catch (error) {
    console.error('Error en sincronización:', error);
    process.exit(1);
}






