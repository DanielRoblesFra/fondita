const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROD_REPO_URL = process.env.PROD_REPO_URL;
const GH_TOKEN = process.env.GH_TOKEN;
const PROD_REPO_DIR = path.join(__dirname, '..', 'production-repo');
const BRANCH = 'main';
const API_BASE_URL = 'https://fondita.onrender.com';

// Extraer usuario y repositorio de la URL
const repoMatch = PROD_REPO_URL.match(/github\.com\/([^\/]+)\/([^\.]+)/);
const GIT_USERNAME = repoMatch ? repoMatch[1] : '';
const REPO_NAME = repoMatch ? repoMatch[2] : '';

console.log('🔄 Iniciando sincronización con repositorio de producción...');

try {
    // Construir URL con autenticación
    const AUTH_REPO_URL = `https://${GIT_USERNAME}:${GH_TOKEN}@github.com/${GIT_USERNAME}/${REPO_NAME}.git`;

    // Clonar o actualizar el repositorio de producción
    if (!fs.existsSync(PROD_REPO_DIR)) {
        console.log('📦 Clonando repositorio de producción...');
        execSync(`git clone ${AUTH_REPO_URL} ${PROD_REPO_DIR}`, { stdio: 'inherit' });
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
    if (!fs.existsSync(path.join(PROD_REPO_DIR, 'data'))) {
        fs.mkdirSync(path.join(PROD_REPO_DIR, 'data'));
    }
    if (!fs.existsSync(path.join(PROD_REPO_DIR, 'img'))) {
        fs.mkdirSync(path.join(PROD_REPO_DIR, 'img'));
    }

    // Función para reemplazar las URLs en los archivos JavaScript
    function replaceApiUrls(content) {
        return content.replace(/fetch\(\s*["']\/api/g, `fetch("${API_BASE_URL}/api`);
    }

    // Copiar cada archivo
    for (const file of filesToCopy) {
        const srcPath = path.join(__dirname, '..', file.src);
        const destPath = path.join(PROD_REPO_DIR, file.dest);
        
        if (fs.existsSync(srcPath)) {
            if (file.src.endsWith('.js')) {
                let content = fs.readFileSync(srcPath, 'utf8');
                content = replaceApiUrls(content);
                fs.writeFileSync(destPath, content, 'utf8');
                console.log(`✅ Copiado y modificado: ${file.src} → ${file.dest}`);
            } else {
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ Copiado: ${file.src} → ${file.dest}`);
            }
        } else {
            console.log(`⚠️  Advertencia: ${file.src} no existe`);
        }
    }

    // Eliminar todas las imágenes existentes primero
    console.log('🗑️ Eliminando imágenes anteriores...');
    const destImgDir = path.join(PROD_REPO_DIR, 'img');
    if (fs.existsSync(destImgDir)) {
        const files = fs.readdirSync(destImgDir);
        for (const file of files) {
            fs.unlinkSync(path.join(destImgDir, file));
            console.log(`✅ Eliminada: ${file}`);
        }
    }

    // Copiar TODAS las imágenes de la carpeta img
    console.log('🖼️ Copiando todas las imágenes...');
    const srcImgDir = path.join(__dirname, '..', 'img');
    
    if (fs.existsSync(srcImgDir)) {
        const images = fs.readdirSync(srcImgDir);
        
        for (const image of images) {
            // Solo copiar archivos de imagen
            if (image.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
                const srcPath = path.join(srcImgDir, image);
                const destPath = path.join(destImgDir, image);
                
                if (fs.statSync(srcPath).isFile()) {
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`✅ Copiada imagen: ${image}`);
                }
            }
        }
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
        // Usar la URL con autenticación para hacer push
        execSync(`cd ${PROD_REPO_DIR} && git push ${AUTH_REPO_URL} ${BRANCH}`, { stdio: 'inherit' });

        console.log('✅ Sincronización completada con éxito!');
    } else {
        console.log('✅ No hay cambios detectados. Todo está actualizado.');
    }
} catch (error) {
    console.error('Error en sincronización:', error);
    process.exit(1);
}
