// Se importa antes que cualquier módulo de la app: dotenv no pisa variables que ya
// existen, así los tests nunca usan la base ni la cuenta de email del .env real
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'secreto-solo-para-tests'
process.env.MAIL_HOST = ''
