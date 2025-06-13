fetch('http://localhost:5000/api/admin', {
    headers: { 'x-api-key': 'CEDO_@admin-Database' }
})
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);