const express = require('express')
const cors = require('cors')
const multer = require('multer')
const pdfParse = require('pdf-parse')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

// Store uploaded files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.txt']

        const extension = file.originalname
            .substring(file.originalname.lastIndexOf('.'))
            .toLowerCase()

        if (allowed.includes(extension)) {
            cb(null, true)
        } else {
            cb(new Error('Only PDF and TXT files are supported'))
        }
    }
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'UNFOG backend is running'
    })
})

// Upload and extract document text
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No document uploaded'
            })
        }

        let text = ''

        if (req.file.mimetype === 'text/plain') {
            text = req.file.buffer.toString('utf-8')
        } else if (req.file.mimetype === 'application/pdf') {
            const parser = new pdfParse.PDFParse({
                data: req.file.buffer
            })

            const result = await parser.getText()

            text = result.text

            await parser.destroy()
        }

        res.json({
            message: 'Document uploaded and processed successfully',
            filename: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            text: text.trim()
        })
    } catch (error) {
        console.error('Document processing error:', error)

        res.status(500).json({
            error: 'Failed to process document',
            details: error.message
        })
    }
})

// Extract requirements from document text
app.post('/api/requirements/extract', (req, res) => {
    try {
        const { text } = req.body

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'Document text is required'
            })
        }

        const lines = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)

        const requirementKeywords = [
            'shall',
            'must',
            'should',
            'required',
            'requirement',
            'needs to',
            'expected to'
        ]

        const requirements = lines
            .filter(line => {
                const lower = line.toLowerCase()

                return requirementKeywords.some(keyword =>
                    lower.includes(keyword)
                )
            })
            .slice(0, 20)
            .map((line, index) => ({
                id: `R${index + 1}`,
                text: line
            }))

        res.json({
            count: requirements.length,
            requirements
        })
    } catch (error) {
        console.error('Requirement extraction error:', error)

        res.status(500).json({
            error: 'Failed to extract requirements'
        })
    }
})

// Search for evidence supporting each requirement
app.post('/api/evidence/search', (req, res) => {
    try {
        const { text, requirements } = req.body

        if (!text || !requirements || !requirements.length) {
            return res.status(400).json({
                error: 'Document text and requirements are required'
            })
        }

        // Split document into individual sentences
        const sentences = text
            .replace(/\s+/g, ' ')
            .split(/(?<=[.!?])\s+/)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 20)

        const evidence = requirements.map(requirement => {
            const requirementWords = requirement.text
                .toLowerCase()
                .split(/\W+/)
                .filter(word => word.length > 3)

            let bestSentence = ''
            let bestScore = 0

            for (const sentence of sentences) {

                if (sentence === requirement.text.trim()) {
                    continue
                }

                const sentenceWords = sentence.toLowerCase()

                const score = requirementWords.reduce((total, word) => {
                    return total + (
                        sentenceWords.includes(word) ? 1 : 0
                    )
                }, 0)

                if (score > bestScore) {
                    bestScore = score
                    bestSentence = sentence
                }
            }

            const matchPercentage =
                requirementWords.length > 0
                    ? Math.round(
                        (bestScore / requirementWords.length) * 100
                    )
                    : 0

            let status
            let confidence

            if (bestScore === 0) {
                status = 'FAIL'
                confidence = 'High'
            } else if (matchPercentage >= 60) {
                status = 'PASS'
                confidence = 'High'
            } else if (matchPercentage >= 30) {
                status = 'PARTIAL'
                confidence = 'Medium'
            } else {
                status = 'FAIL'
                confidence = 'Low'
            }

            const matchedWords = requirementWords.filter(word =>
                bestSentence.toLowerCase().includes(word)
            )

            let reason

            if (bestScore === 0) {
                reason = 'No relevant terms from this requirement were found in the document.'
            } else {
                const matchedTerms = matchedWords
                    .slice(0, 6)
                    .join(', ')

                if (matchPercentage >= 60) {
                    reason = `The evidence directly matches key requirement terms: ${matchedTerms}.`
                } else if (matchPercentage >= 30) {
                    reason = `The evidence matches some requirement terms (${matchedTerms}), but additional support may be needed.`
                } else {
                    reason = `Only limited requirement terms were found in the evidence: ${matchedTerms}.`
                }
            }

            return {
                requirementId: requirement.id,
                requirement: requirement.text,
                evidence: bestSentence || 'No supporting evidence found',
                status,
                confidence,
                matchPercentage,
                reason
            }
        })

        res.json({
            evidence
        })
    } catch (error) {
        console.error('Evidence verification error:', error)

        res.status(500).json({
            error: 'Failed to verify evidence',
            details: error.message
        })
    }
})

// Handle server errors
app.use((err, req, res, next) => {
    console.error('Server error:', err)

    res.status(400).json({
        error: err.message
    })
})

// Start server
app.listen(PORT, () => {
    console.log(`UNFOG backend running on http://localhost:${PORT}`)
})