// Configure CORS more explicitly for debugging
app.use(cors({
  origin: ['http://localhost:3050', 'http://127.0.0.1:3050'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add logging middleware for debugging API calls
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Log request body for non-GET requests (but hide passwords)
  if (req.method !== 'GET' && req.body) {
    const logSafeBody = { ...req.body };
    if (logSafeBody.password) logSafeBody.password = '[HIDDEN]';
    console.log('Request body:', logSafeBody);
  }
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`);
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Continue with the rest of the middleware and routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ... existing routes and code ... 