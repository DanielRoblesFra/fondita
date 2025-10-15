// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MIDDLEWARES OPTIMIZADOS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public', { 
  maxAge: '1d',
  etag: false 
}));
app.use('/admin', express.static('admin'));
app.use('/img', express.static('img', {
  maxAge: '7d',
  etag: false
}));

// ✅ SESIONES SIMPLIFICADAS
const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.timestamp > SESSION_TIMEOUT) {
      sessions.delete(token);
    }
  }
}
setInterval(cleanupSessions, 5 * 60 * 1000); // Cada 5 minutos

function isLoggedIn(req, res, next) {
  const token = req.headers.authorization;
  if (token && sessions.has(token)) {
    sessions.get(token).timestamp = Date.now(); // Renew session
    next();
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
}

// ✅ MULTER OPTIMIZADO
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'img'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '.jpg'); // Siempre JPG para optimizar
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // ✅ REDUCIDO A 1MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    cb(null, extName && mimeType);
  }
});

// ✅ LOGIN OPTIMIZADO
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = 'session-' + Date.now();
    sessions.set(token, { 
      user: username, 
      timestamp: Date.now() 
    });
    
    const isAjax = req.headers['content-type'] === 'application/json';
    
    if (isAjax) {
      res.json({ token, message: 'Login exitoso' });
    } else {
      res.redirect('/admin');
    }
  } else {
    const isAjax = req.headers['content-type'] === 'application/json';
    
    if (isAjax) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    } else {
      res.redirect('/login?error=1');
    }
  }
});

// ✅ RUTAS CRÍTICAS OPTIMIZADAS
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

  // ✅ ELIMINAR IMAGEN ANTERIOR SI EXISTE
  if (req.body.oldFilename && req.body.oldFilename.trim() !== '') {
    const oldPath = path.join(__dirname, 'img', req.body.oldFilename);
    try {
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    } catch (error) {
      console.log('⚠️ No se pudo eliminar imagen anterior:', error.message);
    }
  }

  res.json({ filename: req.file.filename });
});

// ✅ GUARDAR Y SINCRONIZAR - VERSIÓN NO BLOQUEANTE
app.post('/api/save-and-sync', isLoggedIn, (req, res) => {
  try {
    const { menuData } = req.body;
    
    // 1. Guardar localmente (RÁPIDO)
    fs.writeFileSync('data/menu.json', JSON.stringify(menuData, null, 2));
    
    // 2. Responder INMEDIATAMENTE
    res.json({ 
      success: true, 
      message: 'Menú guardado. Sincronizando en segundo plano...' 
    });
    
    // 3. Sincronización ASÍNCRONA (no bloquea)
    process.nextTick(() => {
      try {
        execSync('node scripts/sync-to-production.js', { 
          stdio: 'inherit', 
          timeout: 45000, // ✅ REDUCIDO A 45s
          cwd: __dirname 
        });
      } catch (syncError) {
        console.log('⚠️ Error en sync (no crítico):', syncError.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Error al guardar:', error);
    res.status(500).json({ error: 'Error al guardar' });
  }
});

// ✅ RUTAS DE SERVICIO
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

// ✅ MANEJO DE ERRORES GLOBAL
process.on('uncaughtException', (error) => {
  console.error('⚠️ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promise rechazada:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ULTRA optimizado en puerto ${PORT}`);
  console.log(`💾 Memoria inicial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});
