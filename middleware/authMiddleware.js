import jwt from 'jsonwebtoken';

const JWT_SECRET = '9da0d0375b9058133a9044663dffe753772dfe86c6f48f3caac81dcd37df4c222b1f92852a2f037c7c9b5316c994f29ee26bf599b216209ead76fd9c5a12dad6';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
} 