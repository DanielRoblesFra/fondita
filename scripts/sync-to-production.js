const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROD_REPO_URL = "https://github.com/DanielRoblesFra/fondita-production.git";
const GH_TOKEN = process.env.GH_TOKEN;
const PROD_REPO_DIR = path.join(__dirname, '..', 'production-repo');
const BRANCH = 'main';

console.log('🔄 Iniciando sincronización optimizada...');

try {
    // ✅ CONFIGURACIÓN INICIAL (mantenemos esto)
    try {
        execSync('git config user.email "render@fondita.com"', { stdio: 'inherit' });
        execSync('git config user.name "Render Bot"', { stdio: 'inherit' });
        console.log('✅ Configuración de Git establecida');
    } catch (error) {
        console.log('⚠️ Error en configuración Git:', error.message);
    }

    // ✅ EXCLUIR production-repo DE .gitignore (simplificado)
    try {
        const gitignorePath = path.join(__dirname, '..', '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            if (!gitignoreContent.includes('production-repo')) {
                fs.writeFileSync(gitignorePath, gitignoreContent + '\nproduction-repo/\n');
                console.log('✅ production-repo agregado a .gitignore');
            }
        }
    } catch (error) {
        console.log('⚠️ No se pudo actualizar .gitignore:', error.message);
    }

    // ✅ OBTENER URL DE AUTENTICACIÓN
    const repoMatch = PROD_REPO_URL.match(/github\.com\/([^\/]+)\/([^\.]+)/);
    const GIT_USERNAME = repoMatch ? repoMatch[1] : '';
    const REPO_NAME = repoMatch ? repoMatch[2] : '';
    const AUTH_REPO_URL = `https://${GIT_USERNAME}:${GH_TOKEN}@github.com/${GIT_USERNAME}/${REPO_NAME}.git`;

    // ✅ OPTIMIZADO: Actualizar repositorio existente en lugar de clonar siempre
    if (!fs.existsSync(PROD_REPO_DIR)) {
        console.log('📦 Clonando repositorio de producción (primera vez)...');
        execSync(`git clone ${AUTH_REPO_URL} ${PROD_REPO_DIR}`, { stdio: 'inherit' });
    } else {
        console.log('📥 Actualizando repositorio existente...');
        execSync(`cd ${PROD_REPO_DIR} && git fetch origin && git reset --hard origin/${BRANCH} && git clean -fd`, { stdio: 'inherit' });
    }

    // Configurar Git para commits en el repo de producción
    execSync(`cd ${PROD_REPO_DIR} && git config user.email "render@fondita.com"`, { stdio: 'inherit' });
    execSync(`cd ${PROD_REPO_DIR} && git config user.name "Render Bot"`, { stdio: 'inherit' });

    console.log('🗂️ Copiando archivos estáticos...');

    // ✅ CARGAR DATOS DEL MENÚ (mantenemos esto)
console.log('📊 Cargando datos ACTUALIZADOS del menú...');
const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
let menuData = {};

try {
    // ✅ FORZAR LECTURA FRESCA - no usar caché
    const menuContent = fs.readFileSync(menuPath, 'utf8');
    menuData = JSON.parse(menuContent);
    console.log('✅ Datos ACTUALIZADOS del menú cargados correctamente');
    
    if (menuData.menu_semana) {
        console.log('📅 Estado ACTUAL del menú semanal:');
        menuData.menu_semana.forEach(dia => {
            console.log(`   📅 ${dia.dia}: ${dia.imagen} - ${dia.platillos.length} platillos`);
        });
    }
    
    // ✅ DEBUG: Mostrar contenido actual
    console.log('🔍 Contenido actual de menu.json:');
    console.log('   Carta:', menuData.carta?.[0]?.nombre || 'No hay carta');
    console.log('   Días menu_semana:', menuData.menu_semana?.length || 0);
    
} catch (error) {
    console.error('❌ Error cargando menu.json ACTUALIZADO:', error.message);
    menuData = { carta: [], menu_semana: [] };
}

    // ✅ FUNCIONES PARA ARCHIVOS AUTÓNOMOS (mantenemos)
    function createAutonomousLaCarta() {
        return `
let currentPage = 0;
const container = document.getElementById("bookContainer");
let pages = [];

const menuData = ${JSON.stringify(menuData, null, 2)};

function cargarCarta() {
    container.innerHTML = "";
    
    if (menuData.carta && menuData.carta.length > 0) {
        const platillo = menuData.carta[0];
        const tituloCarta = platillo.tituloCarta || "Carta del día";
        const textoPagina4 = platillo.pagina4 || 'Información adicional del restaurante';
        
        // Páginas del libro
        const pagesHTML = [
            '<div class="content"><h2>' + tituloCarta + '</h2><img src="img/logo.png" alt="Logo Restaurante" class="page-image"><p>' + platillo.nombre + '</p><div class="back"></div></div>',
            '<div class="content"><h2>' + platillo.nombre + '</h2><p>' + platillo.descripcion + '</p><div class="back"></div></div>',
            '<div class="content"><p>Costo del platillo: ' + platillo.precio + '</p><p>' + platillo.pago.mensaje + '</p><p>' + platillo.pago.banco + '</p><div class="back"></div></div>',
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

document.addEventListener("DOMContentLoaded", cargarCarta);
`;
    }

    function createAutonomousMenuSemana() {
        return `document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("menuSemanaContainer");
    const menuData = ${JSON.stringify(menuData, null, 2)};

    if (container && menuData.menu_semana) {
        container.innerHTML = "";
        menuData.menu_semana.forEach(dia => {
            const platillosHTML = dia.platillos.map(p => '<li>' + p + '</li>').join("");
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = '<div class="card-inner"><div class="card-front"><h1>' + dia.dia + '</h1><p>' + dia.fecha + '</p></div><div class="card-back"><img src="img/' + dia.imagen + '" alt="' + dia.dia + '" class="dish-image"><ul class="menu-list">' + platillosHTML + '</ul></div></div>';
            container.appendChild(card);
        });
    }
});`;
    }

    // ✅ OPTIMIZADO: Función para corregir rutas
    function fixImagePaths(content) {
        return content
            .replace(/src="\/img\//g, 'src="img/')
            .replace(/src='\/img\//g, "src='img/")
            .replace(/src="https:\/\/fondita\.onrender\.com\/img\//g, 'src="img/')
            .replace(/src='https:\/\/fondita\.onrender\.com\/img\//g, "src='img/")
            .replace(/url\("\/img\//g, 'url("img/')
            .replace(/url\('\/img\//g, "url('img/")
            .replace(/url\(\/img\//g, 'url(img/');
    }

    // ✅ CREAR ARCHIVOS AUTÓNOMOS
    console.log('📝 Creando archivos autónomos...');
    
    const laCartaContent = createAutonomousLaCarta();
    fs.writeFileSync(path.join(PROD_REPO_DIR, 'la-carta.js'), laCartaContent, 'utf8');
    console.log('✅ la-carta.js creado (autónomo)');

    const menuSemanaContent = createAutonomousMenuSemana();
    fs.writeFileSync(path.join(PROD_REPO_DIR, 'menu-semana.js'), menuSemanaContent, 'utf8');
    console.log('✅ menu-semana.js creado (autónomo)');

    // ✅ COPIAR ARCHIVOS ESTÁTICOS (optimizado)
    const filesToCopy = [
        { src: 'public/index.html', dest: 'index.html' },
        { src: 'public/estilos.css', dest: 'estilos.css' },
        { src: 'public/menu.js', dest: 'menu.js' },
        { src: 'public/preguntas.js', dest: 'preguntas.js' },
        { src: 'public/scoll.js', dest: 'scoll.js' },
        { src: 'data/menu.json', dest: 'menu.json' }
    ];

    const CACHE_BUST_TIMESTAMP = new Date().getTime();
    
    for (const file of filesToCopy) {
        const srcPath = path.join(__dirname, '..', file.src);
        const destPath = path.join(PROD_REPO_DIR, file.dest);
        
        if (fs.existsSync(srcPath)) {
            let content = fs.readFileSync(srcPath, 'utf8');
            
            if (file.dest === 'index.html') {
                content = fixImagePaths(content);
                // Cache busting simplificado
                content = content.replace(/(src|href)=["'](.*?\.(jpg|jpeg|png|gif|svg|webp|avif))(\?v=\d+)?["']/gi, 
                    (match, attr, url) => attr + '="' + url + '?v=' + CACHE_BUST_TIMESTAMP + '"');
            }
            
            fs.writeFileSync(destPath, content, 'utf8');
            console.log('✅ Copiado: ' + file.src + ' → ' + file.dest);
        } else {
            console.log('⚠️  Advertencia: ' + file.src + ' no existe');
        }
    }

    // ==================== SECCIÓN OPTIMIZADA - MANEJO INTELIGENTE DE IMÁGENES ====================

    console.log('🖼️ Sincronizando imágenes de forma inteligente...');
    const srcImgDir = path.join(__dirname, '..', 'img');
    const destImgDir = path.join(PROD_REPO_DIR, 'img');

    // Crear directorio si no existe
    if (!fs.existsSync(destImgDir)) {
        fs.mkdirSync(destImgDir, { recursive: true });
    }

    let copiedCount = 0;
    let skippedCount = 0;

    if (fs.existsSync(srcImgDir)) {
        const images = fs.readdirSync(srcImgDir);
        
        // ✅ OPTIMIZADO: Copiar solo imágenes NUEVAS o MODIFICADAS
        for (const image of images) {
            const srcPath = path.join(srcImgDir, image);
            const destPath = path.join(destImgDir, image);
            
            if (fs.statSync(srcPath).isFile() && /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|tiff)$/i.test(image)) {
                
                const needsCopy = !fs.existsSync(destPath) || 
                                fs.statSync(srcPath).mtime > fs.statSync(destPath).mtime;
                
                if (needsCopy) {
                    fs.copyFileSync(srcPath, destPath);
                    console.log('✅ Copiada/Actualizada: ' + image);
                    copiedCount++;
                } else {
                    skippedCount++;
                }
            }
        }
        
        console.log(`🖼️  Resumen: ${copiedCount} imágenes copiadas, ${skippedCount} imágenes sin cambios`);
    } else {
        console.log('❌ Directorio de imágenes fuente no encontrado');
    }

    // ✅ OPCIONAL: Limpieza de imágenes HUÉRFANAS
    console.log('🧹 Verificando imágenes huérfanas...');
    if (fs.existsSync(destImgDir)) {
        const prodImages = fs.readdirSync(destImgDir);
        const usedImages = new Set();
        
        // Obtener imágenes USADAS actualmente
        if (menuData.menu_semana) {
            menuData.menu_semana.forEach(dia => {
                if (dia.imagen && dia.imagen.trim() !== '') {
                    usedImages.add(dia.imagen);
                }
            });
        }
        
        // Imágenes fijas que siempre deben mantenerse
        usedImages.add('logo.png');
        usedImages.add('portada-login.jpg');
        usedImages.add('portada.avif');
        
        // Eliminar imágenes que ya NO se usan
        let deletedCount = 0;
        prodImages.forEach(image => {
            if (!usedImages.has(image) && /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|tiff)$/i.test(image)) {
                try {
                    fs.unlinkSync(path.join(destImgDir, image));
                    console.log('🗑️  Eliminada huérfana: ' + image);
                    deletedCount++;
                } catch (unlinkError) {
                    console.log('⚠️ No se pudo eliminar: ' + image);
                }
            }
        });
        
        if (deletedCount > 0) {
            console.log(`🧹 Imágenes huérfanas eliminadas: ${deletedCount}`);
        }
    }

    // ==================== COMMIT Y PUSH ====================

    console.log('💾 Forzando detección de cambios...');
    execSync('cd ' + PROD_REPO_DIR + ' && git add -A', { stdio: 'inherit' });
    
    const status = execSync('cd ' + PROD_REPO_DIR + ' && git status --porcelain').toString();
    
    if (status.trim() !== '') {
        console.log('💾 Haciendo commit de los cambios...');
        const commitMessage = 'Actualización automática: ' + new Date().toLocaleString();
        execSync('cd ' + PROD_REPO_DIR + ' && git commit -m "' + commitMessage + '"', { stdio: 'inherit' });

        console.log('🚀 Subiendo cambios...');
        execSync('cd ' + PROD_REPO_DIR + ' && git push ' + AUTH_REPO_URL + ' ' + BRANCH, { stdio: 'inherit' });

        console.log('✅ Sincronización optimizada completada!');
    } else {
        console.log('✅ No hay cambios detectados. Todo está actualizado.');
    }
} catch (error) {
    console.error('Error en sincronización:', error);
    process.exit(1);
}


