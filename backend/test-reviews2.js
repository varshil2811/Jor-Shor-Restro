async function test() {
  const res = await fetch('http://localhost:5000/api/reviews');
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Reviews count:', Array.isArray(data) ? data.length : 'Not an array', data);
}
test();
