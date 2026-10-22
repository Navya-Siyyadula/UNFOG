import { useState } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [documentText, setDocumentText] = useState('')
  const [requirements, setRequirements] = useState([])
  const [evidence, setEvidence] = useState([])

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
                setUploadStatus('Uploading and processing...')

                const formData = new FormData()
                formData.append('document', file)

                try {
                  const response = await fetch(
                    'http://localhost:5000/api/documents/upload',
                    {
                      method: 'POST',
                      body: formData
                    }
                  )

                  const data = await response.json()

                  if (!response.ok) {
                    throw new Error(data.error || 'Upload failed')
                  }
                  setDocumentText(data.text)

                  const requirementResponse = await fetch(
                    'http://localhost:5000/api/requirements/extract',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        text: data.text
                      })
                    }
                  )

                  const requirementData = await requirementResponse.json()

                  if (!requirementResponse.ok) {
                    throw new Error(
                      requirementData.error || 'Requirement extraction failed'
                    )
                  }

                  setRequirements(requirementData.requirements)

                  const evidenceResponse = await fetch(
                    'http://localhost:5000/api/evidence/search',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        text: data.text,
                        requirements: requirementData.requirements
                      })
                    }
                  )

                  const evidenceData = await evidenceResponse.json()

                  if (!evidenceResponse.ok) {
                    throw new Error(
                      evidenceData.error || 'Evidence search failed'
                    )
                  }

                  setEvidence(evidenceData.evidence)

                  setUploadStatus(
                    `Processed successfully — ${data.text.length} characters extracted`
                  )

                } catch (error) {
                  setUploadStatus(`Error: ${error.message}`)
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
            {documentText && (
              <div className="document-preview">
                <h3>Extracted Document Text</h3>
                <pre>{documentText}</pre>
              </div>
            )}

            {requirements.length > 0 && (
              <div className="requirements-panel">
                <h3>Extracted Requirements</h3>

                {requirements.map((requirement) => (
                  <div className="requirement-item" key={requirement.id}>
                    <strong>{requirement.id}</strong>
                    <span>{requirement.text}</span>
                  </div>
                ))}
              </div>
            )}

            {evidence.length > 0 && (
              <div className="evidence-panel">
                <h3>Evidence Matrix</h3>

                <div className="evidence-table">
                  <div className="evidence-header">
                    <strong>ID</strong>
                    <strong>Requirement</strong>
                    <strong>Evidence</strong>
                    <strong>Status</strong>
                    <strong>Confidence</strong>
                  </div>

                  {evidence.map((item) => (
                    <div className="evidence-row" key={item.requirementId}>
                      <strong>{item.requirementId}</strong>

                      <span>{item.requirement}</span>

                      <span>
                        {item.evidence}

                        <small className="evidence-reason">
                          {item.reason}
                        </small>
                      </span>

                      <span className={`status ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>

                      <span className="confidence">
                        {item.confidence}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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