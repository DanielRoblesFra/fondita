const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROD_REPO_URL = process.env.PROD_REPO_URL;
const PROD_REPO_DIR = path.join(__dirname, '..', 'production-repo');
const BRANCH = 'main';
const API_BASE_URL = 'https://fondita.onrender.com';

// Generar un timestamp único para el cache busting
const CACHE_BUSTING_TIMESTAMP = new Date().getTime();

console.log('🔄 Iniciando sincronización con repositorio de producción...');
console.log(`⏰ Timestamp para cache busting: ${CACHE_BUSTING_TIMESTAMP}`);

try {
    // Clonar o actualizar el repositorio de producción
    if (!fs.existsSync(PROD_REPO_DIR)) {
        console.log('📦 Clonando repositorio de producción...');
        execSync(`git clone ${PROD_REPO_URL} ${PROD_REPO_DIR}`, { stdio: 'inherit' });
    } else {
        console.log('📥 Actualizando repositorio existente...');
        execSync(`cd ${PROD_REPO_DIR} && git fetch origin && git reset --hard origin/${BRANCH}`, { stdio: 'inherit' });
    }

    // Configurar Git para commits
    execSync(`cd ${PROD_REPO_DIR} && git config user.email "render@fondita.com"`, { stdio: 'inherit' });
    execSync(`cd ${PROD_REPO_DIR} && git config user.name "Render Bot"`, { stdio: 'inherit' });

    console.log('🗂️ Copiando archivos estáticos...');

    // Archivos a copiar
    const filesToCopy = [
        { src: 'public/index.html', dest: 'index.html' },
        { src: 'public/estilos.css', dest: 'estilos.css' },
        { src: 'public/menu.js', dest: 'menu.js' },
        { src: 'public/la-carta.js', dest: 'la-carta.js' },
        { src: 'public/menu-semana.js', dest: 'menu-semana.js' },
        { src: 'public/preguntas.js', dest: 'preguntas.js' },
        { src: 'public/scoll.js', dest: 'scoll.js' }
    ];

    // Crear directorios necesarios
    const directoriesToCreate = ['data', 'img', 'js', 'css'];
    for (const dir of directoriesToCreate) {
        if (!fs.existsSync(path.join(PROD_REPO_DIR, dir))) {
            fs.mkdirSync(path.join(PROD_REPO_DIR, dir), { recursive: true });
            console.log(`📁 Directorio creado: ${dir}`);
        }
    }

    // Función para reemplazar las URLs en los archivos JavaScript
    function replaceApiUrls(content) {
        return content.replace(/fetch\(\s*["']\/api/g, `fetch("${API_BASE_URL}/api`);
    }

    // Función para agregar parámetros de cache busting
    function addCacheBusting(content, fileExtension) {
        const cacheBustingRegex = {
            'html': /(href|src)=["']([^"']+\.(css|js|png|jpg|jpeg|gif|svg))(\?v=\d+)?["']/g,
            'css': /url\(["']?([^"')]+\.(png|jpg|jpeg|gif|svg))(\?v=\d+)?["']?\)/g,
            'js': /(\.src|\.href|import\()\s*["']([^"']+\.(js|css))(\?v=\d+)?["']/g
        };

        if (fileExtension === 'html') {
            return content.replace(cacheBustingRegex.html, (match, attr, url) => {
                return `${attr}="${url}?v=${CACHE_BUSTING_TIMESTAMP}"`;
            });
        } else if (fileExtension === 'css') {
            return content.replace(cacheBustingRegex.css, (match, url) => {
                return `url("${url}?v=${CACHE_BUSTING_TIMESTAMP}")`;
            });
        } else if (fileExtension === 'js') {
            return content.replace(cacheBustingRegex.js, (match, prefix, url) => {
                return `${prefix} "${url}?v=${CACHE_BUSTING_TIMESTAMP}"`;
            });
        }
        return content;
    }

    // Copiar cada archivo
    for (const file of filesToCopy) {
        const srcPath = path.join(__dirname, '..', file.src);
        const destPath = path.join(PROD_REPO_DIR, file.dest);
        
        if (fs.existsSync(srcPath)) {
            let content = fs.readFileSync(srcPath, 'utf8');
            
            // Reemplazar URLs de API
            if (file.src.endsWith('.js')) {
                content = replaceApiUrls(content);
            }
            
            // Agregar cache busting según el tipo de archivo
            if (file.src.endsWith('.html')) {
                content = addCacheBusting(content, 'html');
            } else if (file.src.endsWith('.css')) {
                content = addCacheBusting(content, 'css');
            } else if (file.src.endsWith('.js')) {
                content = addCacheBusting(content, 'js');
            }
            
            fs.writeFileSync(destPath, content, 'utf8');
            console.log(`✅ Copiado y modificado: ${file.src} → ${file.dest}`);
        } else {
            console.log(`⚠️  Advertencia: ${file.src} no existe`);
        }
    }

    // Copiar todas las imágenes de la carpeta img
    console.log('🖼️ Copiando todas las imágenes...');
    const srcImgDir = path.join(__dirname, '..', 'img');
    const destImgDir = path.join(PROD_REPO_DIR, 'img');
    
    if (fs.existsSync(srcImgDir)) {
        // Eliminar imágenes existentes en el directorio de destino
        if (fs.existsSync(destImgDir)) {
            fs.rmSync(destImgDir, { recursive: true, force: true });
            fs.mkdirSync(destImgDir, { recursive: true });
        }
        
        // Copiar todas las imágenes
        const copyImages = (src, dest) => {
            const items = fs.readdirSync(src, { withFileTypes: true });
            for (const item of items) {
                const srcPath = path.join(src, item.name);
                const destPath = path.join(dest, item.name);
                
                if (item.isDirectory()) {
                    if (!fs.existsSync(destPath)) {
                        fs.mkdirSync(destPath, { recursive: true });
                    }
                    copyImages(srcPath, destPath);
                } else if (item.isFile() && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(item.name)) {
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`✅ Copiada imagen: ${item.name}`);
                }
            }
        };
        
        copyImages(srcImgDir, destImgDir);
    } else {
        console.log('⚠️  Advertencia: Directorio de imágenes no encontrado');
    }

    // Forzar la detección de cambios y hacer commit
    console.log('💾 Forzando detección de cambios...');
    
    // Usar git add -A para agregar todos los cambios
    execSync(`cd ${PROD_REPO_DIR} && git add -A`, { stdio: 'inherit' });
    
    // Verificar si hay cambios realmente
    const status = execSync(`cd ${PROD_REPO_DIR} && git status --porcelain`).toString();
    
    if (status.trim() !== '') {
        console.log('💾 Haciendo commit de los cambios...');
        const commitMessage = `Actualización automática: ${new Date().toLocaleString()}`;
        execSync(`cd ${PROD_REPO_DIR} && git commit -m "${commitMessage}"`, { stdio: 'inherit' });

        console.log('🚀 Subiendo cambios al repositorio...');
        execSync(`cd ${PROD_REPO_DIR} && git push origin ${BRANCH}`, { stdio: 'inherit' });

        console.log('✅ Sincronización completada con éxito!');
    } else {
        console.log('✅ No hay cambios detectados. Todo está actualizado.');
    }
} catch (error) {
    console.error('Error en sincronización:', error);
    process.exit(1);
}
