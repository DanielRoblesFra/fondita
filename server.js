// Middleware para CORS y cookies (AGREGAR AL INICIO)
app.use((req, res, next) => {
    // Permitir credenciales desde cualquier origen
    res.header('Access-Control-Allow-Origin', 'https://fondita.onrender.com');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    
    // Forzar HTTPS en producción
    if (process.env.NODE_ENV === 'production') {
        req.connection.encrypted = true;
    }
    
    next();
});

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

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- MIDDLEWARES --------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
// Middleware para forzar cookies en Render (AGREGAR ESTO)
app.use((req, res, next) => {
    // Forzar secure connection en Render
    if (process.env.NODE_ENV === 'production') {
        req.headers['x-forwarded-proto'] = 'https';
    }
    next();
});

// Middleware para debug de cookies (agregar después de session)
app.use((req, res, next) => {
    console.log('🔍 HEADERS DEBUG:', {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        cookie: req.headers.cookie || 'NO COOKIES',
        'x-forwarded-proto': req.headers['x-forwarded-proto']
    });
    next();
});
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

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.loggedIn = true;
        
        // Guardar sesión MANUALMENTE antes de redirigir
        req.session.save((err) => {
            if (err) {
                console.log('❌ Error saving session:', err);
                return res.status(500).send('Error interno');
            }
            
            console.log('✅ Session saved successfully, sessionID:', req.sessionID);
            
            // Establecer cookie MANUALMENTE
            res.cookie('connect.sid', req.sessionID, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 60 * 1000
            });
            
            // Redirigir
            return res.redirect('/admin/index.html');
        });
    } else {
        // ... código de error existente
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

    res.json({ filename: req.file.filename });
});

// -------------------- ARCHIVOS ESTÁTICOS --------------------
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.static('public'));

// -------------------- SERVIDOR --------------------
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
