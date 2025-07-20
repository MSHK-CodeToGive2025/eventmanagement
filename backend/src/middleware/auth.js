import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    console.log('[AUTH] Request headers:', req.headers);
    console.log('[AUTH] Authorization header:', req.header('Authorization'));
    
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('[AUTH] Token found, length:', token.length);
    console.log('[AUTH] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('[AUTH] JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] Token decoded successfully:', { 
      userId: decoded.userId, 
      username: decoded.username,
      role: decoded.role 
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error.message);
    console.error('[AUTH] Error details:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth; 