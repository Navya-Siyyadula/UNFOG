const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const uploadDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`
        cb(null, uniqueName)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.txt']
        const extension = path.extname(file.originalname).toLowerCase()

        if (allowed.includes(extension)) {
            cb(null, true)
        } else {
            cb(new Error('Only PDF and TXT files are supported'))
        }
    }
})

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'UNFOG backend is running'
    })
})

app.post('/api/documents/upload', upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'No document uploaded'
        })
    }

    res.json({
        message: 'Document uploaded successfully',
        filename: req.file.originalname,
        storedFilename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype
    })
})

app.use((err, req, res, next) => {
    res.status(400).json({
        error: err.message
    })
})

app.listen(PORT, () => {
    console.log(`UNFOG backend running on http://localhost:${PORT}`)
})