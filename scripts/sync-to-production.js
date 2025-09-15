const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROD_REPO_URL = process.env.PROD_REPO_URL;
const PROD_REPO_DIR = path.join(__dirname, '..', 'production-repo');
const BRANCH = 'main';
const API_BASE_URL = 'https://fondita.onrender.com';

console.log('🔄 Iniciando sincronización con repositorio de producción...');

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

    // Copiar imágenes permitidas
    const allowedImages = [
        'lunes.jpg',
        'martes.png', 
        'miercoles.jpg',
        'jueves.jpg',
        'viernes.jpg',
        'portada-login.jpg',
        'logo.png'
    ];

    for (const image of allowedImages) {
        const srcPath = path.join(__dirname, '..', 'img', image);
        const destPath = path.join(PROD_REPO_DIR, 'img', image);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copiada imagen: ${image}`);
        } else {
            console.log(`⚠️  Imagen no encontrada: ${image}`);
        }
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
