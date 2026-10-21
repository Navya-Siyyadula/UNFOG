import { useState } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>UNFOG</h1>
          <p>Complex information. Clear understanding.</p>
        </div>

        <div className="header-label">
          Evidence Audit Workbench
        </div>
      </header>

      <main className="main">
        <section className="welcome">
          <p className="eyebrow">TECHNICAL DOCUMENT INTELLIGENCE</p>

          <h2>Turn complex specifications into clear evidence.</h2>

          <p className="description">
            Upload a technical specification and review requirements
            against the evidence contained in the document.
          </p>

          <div>
            <input
              id="document-upload"
              type="file"
              accept=".pdf,.txt"
              hidden
              onChange={async (event) => {
                const file = event.target.files[0]

                if (!file) return

                setSelectedFile(file)
                setUploadStatus('Uploading...')

                const formData = new FormData()
                formData.append('document', file)

                try {
                  const response = await fetch('http://localhost:5000/api/documents/upload', {
                    method: 'POST',
                    body: formData
                  })

                  const data = await response.json()

                  if (!response.ok) {
                    throw new Error(data.error || 'Upload failed')
                  }

                  setUploadStatus('Uploaded successfully')
                } catch (error) {
                  setUploadStatus(error.message)
                }
              }}
            />

            <label htmlFor="document-upload" className="upload-button">
              Upload Document
            </label>

            {selectedFile && (
              <p className="selected-file">
                Selected: {selectedFile.name}
              </p>
            )}
            {uploadStatus && (
              <p className="selected-file">
                {uploadStatus}
              </p>
            )}


          </div>
        </section>

        <section className="matrix-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REQUIREMENTS</p>
              <h3>Evidence Matrix</h3>
            </div>

            <span className="status-info">
              Not analyzed
            </span>
          </div>

          <div className="matrix">
            <div className="matrix-header">
              <span>ID</span>
              <span>Requirement</span>
              <span>Status</span>
              <span>Evidence</span>
            </div>

            <div className="matrix-empty">
              <p>No requirements analyzed yet.</p>
              <span>
                Upload a document and add requirements to begin.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App