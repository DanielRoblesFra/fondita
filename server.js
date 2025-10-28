// server.js 
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURAR GIT PARA RENDER
try {
    execSync(`git config --global user.email "${process.env.GIT_EMAIL}"`);
    execSync(`git config --global user.name "${process.env.GIT_NAME}"`);
    console.log('✅ Git configurado para Render');
} catch (error) {
    console.log('⚠️ Git ya configurado');
}

// ✅ MIDDLEWARES
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public', { maxAge: '1d' }));
app.use('/admin', express.static('admin'));
app.use('/img', express.static('img', { maxAge: '7d' }));

// ✅ AUTENTICACIÓN SIMPLIFICADA (sin sesiones volátiles)
const validTokens = new Set();

// ✅ GENERAR TOKEN VÁLIDO
function generateToken() {
    return 'token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ✅ MIDDLEWARE DE AUTENTICACIÓN MEJORADO
function isLoggedIn(req, res, next) {
    const token = req.headers.authorization || req.query.token;
    
    console.log('🔐 Verificando token:', token ? token.substring(0, 10) + '...' : 'Ausente');
    
    if (token && validTokens.has(token)) {
        console.log('✅ Token válido');
        next();
    } else {
        console.log('❌ Token inválido');
        res.status(401).json({ error: 'No autorizado - token inválido o expirado' });
    }
}

// ✅ LIMPIAR TOKENS CADUCADOS (cada 30 minutos)
setInterval(() => {
    const now = Date.now();
    // Los tokens son válidos por 2 horas
    for (const token of validTokens) {
        const tokenTime = parseInt(token.split('-')[1]);
        if (now - tokenTime > 2 * 60 * 60 * 1000) {
            validTokens.delete(token);
        }
    }
    console.log('🧹 Tokens activos:', validTokens.size);
}, 30 * 60 * 1000);

// ✅ MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'img'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '.jpg');
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        cb(null, extName && mimeType);
    }
});

// RUTA a tu base de datos local
const menuFilePath = path.join("data", "menu.json");

// Función que garantiza que el JSON sea persistente
async function loadPersistentMenu() {
  try {
    // Si existe el archivo local y no está vacío, úsalo
    if (fs.existsSync(menuFilePath)) {
      const data = fs.readFileSync(menuFilePath, "utf8");
      if (data && data.trim().length > 10) {
        console.log("✅ Usando menu.json local");
        return JSON.parse(data);
      }
    }

    // Si no existe (Render se durmió y borró datos), bájalo de GitHub
    console.log("🌐 Recuperando menu.json desde GitHub...");
    const res = await fetch(
      "https://raw.githubusercontent.com/DanielRoblesFra/fondita-production/main/menu.json"
    );

    if (!res.ok) throw new Error("Error al descargar menu.json desde GitHub");

    const json = await res.json();
    // Guarda una copia local para uso inmediato
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(menuFilePath, JSON.stringify(json, null, 2));

    console.log("💾 menu.json restaurado correctamente desde GitHub");
    return json;
  } catch (err) {
    console.error("❌ Error cargando menu.json persistente:", err);
    return {}; // Devuelve vacío si algo falla
  }
}

// ✅ LOGIN MEJORADO
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log('🔐 Intento de login:', username);

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        const token = generateToken();
        validTokens.add(token);
        
        console.log('✅ Login exitoso, token creado');
        
        const isAjax = req.headers['content-type'] === 'application/json';
        
        if (isAjax) {
            res.json({ 
                token, 
                message: 'Login exitoso',
                user: username
            });
        } else {
            // Para login tradicional, redirigir con token en URL
            res.redirect(`/admin?token=${token}`);
        }
    } else {
        console.log('❌ Login fallido');
        
        const isAjax = req.headers['content-type'] === 'application/json';
        
        if (isAjax) {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        } else {
            res.redirect('/login?error=1');
        }
    }
});

// ✅ LOGOUT
app.post('/api/logout', (req, res) => {
    const token = req.headers.authorization;
    if (token) {
        validTokens.delete(token);
        console.log('✅ Logout exitoso');
    }
    res.json({ success: true, message: 'Sesión cerrada' });
});

// ✅ RUTA PÚBLICA PARA CARGAR DATOS PERSISTENTES (SIN AUTENTICACIÓN)
app.get('/api/public/menu', async (req, res) => {
    try {
        const data = await loadPersistentMenu();
        res.json(data);
    } catch (error) {
        console.error("❌ Error en /api/public/menu:", error);
        res.json({ carta: [{}], menu_semana: [] });
    }
});

// ✅ RUTAS PROTEGIDAS
app.get('/api/menu', isLoggedIn, async (req, res) => {
    try {
        const data = await loadPersistentMenu();
        res.json(data);
    } catch (error) {
        console.error("❌ Error en /api/menu:", error);
        res.json({ carta: [{}], menu_semana: [] });
    }
});

app.post('/api/upload-image', isLoggedIn, upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    console.log('✅ Imagen subida:', req.file.filename);

    // Eliminar imagen anterior si existe
    if (req.body.oldFilename && req.body.oldFilename.trim() !== '') {
        const oldPath = path.join(__dirname, 'img', req.body.oldFilename);
        try {
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
                console.log('🗑️ Imagen anterior eliminada');
            }
        } catch (error) {
            console.log('⚠️ No se pudo eliminar imagen anterior');
        }
    }

    res.json({ filename: req.file.filename });
});

app.post('/api/save-persistent', isLoggedIn, (req, res) => {
    try {
        const { menuData } = req.body;
        const menuPath = path.join(__dirname, 'data', 'menu.json');
        
        console.log('💾 Guardando datos persistentes...');
        
        // 1. Crear directorio data si no existe
        if (!fs.existsSync(path.dirname(menuPath))) {
            fs.mkdirSync(path.dirname(menuPath), { recursive: true });
        }
        
        // 2. Guardar en menu.json
        fs.writeFileSync(menuPath, JSON.stringify(menuData, null, 2));
        console.log('✅ menu.json guardado PERSISTENTEMENTE');
        
        // 3. Hacer commit inmediato al repositorio principal
        try {
            execSync('git add data/menu.json', { stdio: 'inherit', cwd: __dirname });
            execSync('git add img/ || true', { stdio: 'inherit', cwd: __dirname });
            execSync('git commit -m "Auto-save: ' + new Date().toLocaleString() + '" || true', 
                    { stdio: 'inherit', cwd: __dirname });
            execSync(`git push https://DanielRoblesFra:${process.env.GH_TOKEN}@github.com/DanielRoblesFra/fondita.git main || true`, 
                    { stdio: 'inherit', cwd: __dirname });
            console.log('✅ Cambios guardados en GitHub (fondita)');
        } catch (gitError) {
            console.log('⚠️ Error en git (puede ser normal):', gitError.message);
        }
        
        res.json({ 
            success: true, 
            message: 'Datos guardados persistentemente en menu.json' 
        });
        
    } catch (error) {
        console.error('❌ Error guardando datos persistentes:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al guardar datos persistentes' 
        });
    }
});

app.get('/api/load-persistent-data', isLoggedIn, (req, res) => {
    try {
        const menuPath = path.join(__dirname, 'data', 'menu.json');
        
        // Verificar si existe el archivo
        if (!fs.existsSync(menuPath)) {
            return res.json({ 
                success: false, 
                message: 'No hay datos persistentes guardados' 
            });
        }
        
        // Leer datos persistentes
        const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
        
        // Obtener lista de imágenes disponibles
        const imgDir = path.join(__dirname, 'img');
        let availableImages = [];
        if (fs.existsSync(imgDir)) {
            availableImages = fs.readdirSync(imgDir);
        }
        
        console.log('📥 Datos persistentes cargados, imágenes:', availableImages.length);
        
        res.json({
            success: true,
            menuData: menuData,
            availableImages: availableImages
        });
        
    } catch (error) {
        console.error('❌ Error cargando datos persistentes:', error);
        res.json({ 
            success: false, 
            error: 'Error al cargar datos' 
        });
    }
});

app.post('/api/save-and-sync', isLoggedIn, (req, res) => {
    console.log('💾 GUARDANDO Y SINCRONIZANDO...');
    
    try {
        const { menuData } = req.body;
        
        // 1. Guardar localmente
        fs.writeFileSync('data/menu.json', JSON.stringify(menuData, null, 2));
        console.log('✅ menu.json guardado LOCALMENTE');
        
        // 2. ✅ COMMIT INMEDIATO AL REPOSITORIO PRINCIPAL (ANTES de responder)
        console.log('🚀 Haciendo commit inmediato...');
        execSync('git add data/menu.json', { stdio: 'inherit', cwd: __dirname });
        execSync('git add img/ || true', { stdio: 'inherit', cwd: __dirname });
        execSync('git commit -m "Actualización: ' + new Date().toLocaleString() + '" || true', 
                { stdio: 'inherit', cwd: __dirname });
        execSync(`git push https://DanielRoblesFra:${process.env.GH_TOKEN}@github.com/DanielRoblesFra/fondita.git main || true`, 
                { stdio: 'inherit', cwd: __dirname });
        
        console.log('✅ Cambios COMMITEADOS a GitHub');
        
        // 3. Responder al usuario
        res.json({ 
            success: true, 
            message: 'Menú guardado y sincronizado.' 
        });
        
        // 4. Sync con producción en segundo plano (OPCIONAL ya que los datos están commitidos)
        setTimeout(() => {
            try {
                execSync('node scripts/sync-to-production.js', { stdio: 'inherit', timeout: 45000, cwd: __dirname });
                console.log('✅ Sync con producción completado');
            } catch (syncError) {
                console.log('⚠️ Error en sync producción:', syncError.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error al guardar' });
    }
});

// ✅ RUTA PARA VERIFICAR SESIÓN
app.get('/api/check-session', isLoggedIn, (req, res) => {
    res.json({ valid: true, message: 'Sesión activa' });
});

// ✅ RUTAS PÚBLICAS
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
    // Si viene con token, servimos el admin
    if (req.query.token && validTokens.has(req.query.token)) {
        res.sendFile(path.join(__dirname, 'admin', 'index.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
    console.log(`🔐 Modo: ${process.env.NODE_ENV}`);
});
