// ✅ SOLO cargar dotenv en desarrollo
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// ✅ Validar variables CRÍTICAS en producción
if (process.env.NODE_ENV === 'production') {
    const requiredVars = ['ADMIN_USER', 'ADMIN_PASS', 'SESSION_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ ERROR: Variables de entorno faltantes:', missingVars);
        process.exit(1);
    }
    }

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ✅ INICIALIZAR app PRIMERO
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MIDDLEWARE de CORS (DESPUÉS de crear app)
app.use((req, res, next) => {
    const allowedOrigins = ['https://fondita.onrender.com', 'https://danielroblesfra.github.io'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    
    // Forzar HTTPS en producción
    if (process.env.NODE_ENV === 'production') {
        req.connection.encrypted = true;
    }
    
    next();
});
// -------------------- MIDDLEWARES --------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ CONFIGURACIÓN DE SESIÓN (orden correcto)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 60 * 1000
    }
}));

// Middleware para rutas protegidas
function isLoggedIn(req, res, next) {
    console.log('🔍 CHECKING SESSION - loggedIn:', req.session.loggedIn);
    if (req.session.loggedIn) {
        next();
    } else {
        res.status(401).send('No autorizado');
    }
}

// -------------------- CONFIGURAR MULTER --------------------
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
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB máximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes .jpg, .jpeg o .png'));
        }
    }
});

// Eliminar imágenes antiguas
function deleteOldImage(filename) {
    if (!filename) return;
    const filePath = path.join(__dirname, 'img', filename);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(`⚠️ No se pudo borrar la imagen: ${filename}`, err.message);
        } else {
            console.log(`🗑️ Imagen eliminada: ${filename}`);
        }
    });
}

// -------------------- RUTAS ESPECÍFICAS --------------------

// ⭐ LOGIN (GET)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// ⭐ LOGIN (POST con validación de error en la misma página)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // ✅ DEBUG TEMPORAL
    console.log('🔍 INTENTO DE LOGIN:', {
        expectedUser: process.env.ADMIN_USER,
        expectedPass: process.env.ADMIN_PASS,
        receivedUser: username,
        receivedPass: password,
        match: username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS
    });

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.loggedIn = true;
        
        // ✅ Guardar sesión MANUALMENTE
        req.session.save((err) => {
            if (err) {
                console.log('❌ Error saving session:', err);
                return res.status(500).send('Error interno');
            }
            
            console.log('✅ Session saved successfully, sessionID:', req.sessionID);
            
            // ✅ Establecer cookie MANUALMENTE
            res.cookie('connect.sid', req.sessionID, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 60 * 1000
            });
            
            console.log('🍪 Cookie header set:', res.getHeaders()['set-cookie']);
            return res.redirect('/admin/index.html');
        });
    } else {
        console.log('❌ LOGIN FALLIDO');
        const loginPath = path.join(__dirname, 'admin', 'login.html');
        let loginPage = fs.readFileSync(loginPath, 'utf-8');

        loginPage = loginPage.replace(
            '<h2>Iniciar Sesión</h2>',
            '<h2>Iniciar Sesión</h2><p class="error">❌ Usuario o contraseña incorrectos</p>'
        );

        res.send(loginPage);
    }
});

// -------------------- LOGOUT --------------------
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('No se pudo cerrar sesión');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ⭐ RUTAS PROTEGIDAS
app.get('/admin/index.html', isLoggedIn, (req, res) => {
    console.log('✅ Acceso concedido a panel admin');
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// ⭐ API ROUTES
app.get('/api/menu', (req, res) => {
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    const menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
    res.json(menu);
});

app.post('/api/menu', isLoggedIn, (req, res) => {
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    fs.writeFileSync(menuPath, JSON.stringify(req.body, null, 2));
    res.send('Menú actualizado');
});

app.post('/api/upload-image', isLoggedIn, upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ningún archivo');
    }

    if (req.body.oldFilename) {
        deleteOldImage(req.body.oldFilename);
    }

    // ✅ EJECUTAR COMMIT EN REPOSITORIO PRINCIPAL
    try {
        const { execSync } = require('child_process');
        console.log('💾 Guardando cambios en repositorio principal...');
        execSync('node scripts/force-commit.js', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error en commit automático:', error);
    }

    res.json({ filename: req.file.filename });
});

// -------------------- NUEVO ENDPOINT PARA SINCRONIZACIÓN --------------------
app.post('/api/sync-production', isLoggedIn, (req, res) => {
    console.log('🔁 Solicitada sincronización con repositorio de producción');
    
    try {
        // Ejecutar el script de sincronización
        const { execSync } = require('child_process');
        execSync('node scripts/sync-to-production.js', { stdio: 'inherit' });
        
        res.json({ success: true, message: 'Sincronización completada con éxito' });
    } catch (error) {
        console.error('Error en sincronización:', error);
        res.status(500).json({ success: false, message: 'Error en la sincronización' });
    }
});

// -------------------- ARCHIVOS ESTÁTICOS --------------------
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.static('public'));

// -------------------- SERVIDOR --------------------
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
