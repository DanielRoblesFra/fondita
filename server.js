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

// ✅ RUTAS PROTEGIDAS
app.get('/api/menu', isLoggedIn, (req, res) => {
    try {
        const menuPath = path.join(__dirname, 'data', 'menu.json');
        const menuData = fs.readFileSync(menuPath, 'utf8');
        res.json(JSON.parse(menuData));
    } catch (error) {
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

// ✅ RUTA PARA CARGAR DATOS PERSISTENTES EN RENDER
app.get('/api/load-persistent-data', (req, res) => {
    try {
        const menuPath = path.join(__dirname, 'data', 'menu.json');
        const imgDir = path.join(__dirname, 'img');
        
        // Cargar menú actual
        const menuData = fs.existsSync(menuPath) 
            ? JSON.parse(fs.readFileSync(menuPath, 'utf8'))
            : { carta: [{}], menu_semana: [] };
        
        // Listar imágenes disponibles
        const images = fs.existsSync(imgDir) 
            ? fs.readdirSync(imgDir).filter(file => /\.(jpg|jpeg|png)$/i.test(file))
            : [];
        
        res.json({
            success: true,
            menuData: menuData,
            availableImages: images
        });
    } catch (error) {
        res.json({
            success: true,
            menuData: { carta: [{}], menu_semana: [] },
            availableImages: []
        });
    }
});

app.post('/api/save-and-sync', isLoggedIn, (req, res) => {
    console.log('💾 Guardando y sincronizando...');
    
    try {
        const { menuData } = req.body;
        
        // 1. Guardar localmente
        fs.writeFileSync('data/menu.json', JSON.stringify(menuData, null, 2));
        console.log('✅ menu.json guardado');
        
        // 2. Responder inmediatamente
        res.json({ 
            success: true, 
            message: 'Menú guardado. Sincronizando...' 
        });
        
        // 3. Sincronización en segundo plano
        setTimeout(() => {
            try {
                console.log('🚀 Iniciando sync-to-production...');
                execSync('node scripts/sync-to-production.js', { 
                    stdio: 'inherit', 
                    timeout: 45000,
                    cwd: __dirname 
                });
                console.log('✅ Sync completado');
            } catch (syncError) {
                console.log('⚠️ Error en sync:', syncError.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
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
