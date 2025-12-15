import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key';
const EXPIRES_IN = '1w';

interface JwtPayLoad {
  userId: string;
  username: string;
}

// Generate a JWT token
export const generateToken = (payload: JwtPayLoad): string => {
  return jwt.sign(
    payload,
    SECRET_KEY,
    { expiresIn: EXPIRES_IN }
  )
}

// Verify token and return the decoded payload
export const verifyToken = (token: string): JwtPayLoad => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayLoad;
    return decoded;
  }
  catch (error) {
    throw new Error('Invalid or expired token');
  }
}
  
