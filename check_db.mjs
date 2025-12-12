import Database from 'better-sqlite3';
const db = new Database(process.env.DATABASE_URL.replace('file:', ''));
const settings = db.prepare('SELECT * FROM botSettings LIMIT 1').get();
console.log('Bot Settings:', JSON.stringify(settings, null, 2));
db.close();
