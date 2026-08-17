const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/jorshor');
  const db = mongoose.connection.db;
  const items = await db.collection('menuitems').find({}).toArray();
  console.log('Total items in DB:', items.length);
  process.exit(0);
}
test();
