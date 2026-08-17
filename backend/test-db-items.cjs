const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/jorshor');
  const db = mongoose.connection.db;
  const items = await db.collection('menuitems').find({}).toArray();
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}
test();
