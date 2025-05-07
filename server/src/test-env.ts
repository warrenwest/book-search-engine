import dotenv from 'dotenv';
dotenv.config();

console.log('JWT_SECRET_KEY:', process.env.JWT_SECRET_KEY);

if (!process.env.JWT_SECRET_KEY) {
  console.error('JWT_SECRET_KEY is NOT loaded!');
} else {
  console.log('JWT_SECRET_KEY is loaded successfully.');
}

