// server.js - VERSIÓN OPTIMIZADA
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/admin', express.static('admin'));
app.use('/img', express.static('img'));

// Configuración simple de sesión
const sessions = new Map();

function isLoggedIn(req, res, next) {
    const token = req.headers.authorization;
    if (token && sessions.has(token)) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
}

// Configurar Multer para imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'img'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        if (extName && mimeType) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes .jpg, .jpeg o .png'));
        }
    }
});

// LOGIN simple
// ⭐ LOGIN (POST - compatible con tu login actual)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log('🔍 INTENTO DE LOGIN:', {
        receivedUser: username,
        match: username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS
    });

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        const token = Date.now().toString();
        sessions.set(token, { user: username, timestamp: Date.now() });
        
        // ✅ DETECTAR SI ES PETICIÓN AJAX O FORM TRADICIONAL
        const isAjax = req.headers['content-type'] === 'application/json';
        
        if (isAjax) {
            // Para admin.js (JSON)
            res.json({ token, message: 'Login exitoso' });
        } else {
            // Para tu login.html actual (redirección)
            res.redirect('/admin');
        }
        
    } else {
        console.log('❌ LOGIN FALLIDO');
        
        // ✅ MANEJAR ERROR PARA AMBOS CASOS
        const isAjax = req.headers['content-type'] === 'application/json';
        
        if (isAjax) {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        } else {
            // Para tu login.html actual - mostrar error en la página
            const loginPath = path.join(__dirname, 'admin', 'login.html');
            let loginPage = fs.readFileSync(loginPath, 'utf-8');

            loginPage = loginPage.replace(
                '<h2>Iniciar Sesión</h2>',
                '<h2>Iniciar Sesión</h2><p class="error">❌ Usuario o contraseña incorrectos</p>'
            );

            res.send(loginPage);
        }
    }
});

// OBTENER menú actual
app.get('/api/menu', isLoggedIn, (req, res) => {
    try {
        const menu = JSON.parse(fs.readFileSync('data/menu.json', 'utf8'));
        res.json(menu);
    } catch (error) {
        res.json({ carta: [], menu_semana: [] });
    }
});

// SUBIR IMAGEN
app.post('/api/upload-image', isLoggedIn, upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    console.log('📸 Imagen subida:', req.file.filename);

    // Eliminar imagen anterior si se proporciona
    if (req.body.oldFilename && req.body.oldFilename.trim() !== '') {
        const oldPath = path.join(__dirname, 'img', req.body.oldFilename);
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log('🗑️ Imagen anterior eliminada:', req.body.oldFilename);
        }
    }

    res.json({ filename: req.file.filename });
});

// GUARDAR menú + SINCRONIZAR en un solo paso
app.post('/api/save-and-sync', isLoggedIn, (req, res) => {
    console.log('💾 GUARDANDO Y SINCRONIZANDO...');
    
    try {
        const { menuData } = req.body;
        
        // 1. Guardar localmente
        fs.writeFileSync('data/menu.json', JSON.stringify(menuData, null, 2));
        console.log('✅ menu.json guardado');
        
        // 2. Responder INMEDIATAMENTE al usuario
        res.json({ 
            success: true, 
            message: 'Menú guardado. Sincronizando con producción...' 
        });
        
        // 3. Sincronización EN SEGUNDO PLANO (no bloquea la respuesta)
        setTimeout(() => {
            try {
                console.log('🚀 Iniciando sync-to-production...');
                
                // Commit básico en repositorio principal
                execSync('git add data/menu.json', { stdio: 'inherit' });
                execSync('git commit -m "Actualizar menú" || true', { stdio: 'inherit' });
                execSync(`git push https://DanielRoblesFra:${process.env.GH_TOKEN}@github.com/DanielRoblesFra/fondita.git main || true`, 
                        { stdio: 'inherit' });
                
                // Sincronización con producción
                execSync('node scripts/sync-to-production.js', { stdio: 'inherit', timeout: 60000 });
                console.log('✅ Sync completado');
                
            } catch (syncError) {
                console.log('⚠️ Error en segundo plano:', syncError.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error al guardar' });
    }
});

// SINCRONIZACIÓN MANUAL
app.post('/api/sync-production', isLoggedIn, (req, res) => {
    console.log('🔁 Sincronización manual solicitada');
    
    try {
        execSync('node scripts/sync-to-production.js', { stdio: 'inherit', timeout: 60000 });
        res.json({ success: true, message: 'Sincronización completada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en sincronización' });
    }
});

// Servir login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Servir admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Ruta principal
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor optimizado en puerto ${PORT}`);
});
