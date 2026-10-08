import express from 'express'

const app = express()

const PORT = 3000

app.get('/api', (req, res) => {
  res.json({
    mensaje: 'API BulkWay funcionando'
  })
})

app.listen(PORT, () => {
  console.log(`API BulkWay ejecutándose en http://localhost:${PORT}`)
})