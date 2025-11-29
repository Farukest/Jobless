/**
 * Custom EditorJS DOCX Tool
 * Supports DOCX file upload and drag & drop
 * Opens modal viewer with book-style 2-page view
 */

import { api } from '@/lib/api'

interface DocxData {
  url: string
  name: string
  size: number
  uploadedAt: string
}

export class DocxTool {
  api: any
  readOnly: boolean
  data: DocxData | null
  wrapper: HTMLElement | null = null

  static get toolbox() {
    return {
      title: 'Document (DOCX)',
      icon: '<svg width="17" height="15" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48z"/></svg>',
    }
  }

  constructor({ data, api, readOnly }: any) {
    this.api = api
    this.readOnly = readOnly
    this.data = data || null
  }

  render() {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('docx-tool')

    if (this.data) {
      // Show document preview
      const preview = this.createDocumentPreview()
      this.wrapper.appendChild(preview)
    } else if (!this.readOnly) {
      // Show upload area
      const uploadArea = this.createUploadArea()
      this.wrapper.appendChild(uploadArea)
    }

    // Add styles
    this.addStyles()

    return this.wrapper
  }

  createDocumentPreview() {
    const preview = document.createElement('div')
    preview.classList.add('docx-tool__preview')

    // Document icon
    const icon = document.createElement('div')
    icon.classList.add('docx-tool__icon')
    icon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 384 512" fill="currentColor">
        <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm220.1-208c-5.7 0-10.6 4-11.7 9.5-20.6 97.7-20.4 95.4-21 103.5-.2-1.2-.4-2.6-.7-4.3-.8-5.1.3.2-23.6-99.5-1.3-5.4-6.1-9.2-11.7-9.2h-13.3c-5.5 0-10.3 3.8-11.7 9.1-24.4 99-24 96.2-24.8 103.7-.1-1.1-.2-2.5-.5-4.2-.7-5.2-14.1-73.3-19.1-99-1.1-5.6-6-9.7-11.8-9.7h-16.8c-7.8 0-13.5 7.3-11.7 14.8 8 32.6 26.7 109.5 33.2 136 1.3 5.4 6.1 9.1 11.7 9.1h25.2c5.5 0 10.3-3.7 11.6-9.1l17.9-71.4c1.5-6.2 2.5-12 3-17.3l2.9 17.3c.1.4 12.6 50.5 17.9 71.4 1.3 5.3 6.1 9.1 11.6 9.1h24.7c5.5 0 10.3-3.7 11.6-9.1 20.8-81.9 30.2-119 34.5-136 1.9-7.6-3.8-14.9-11.6-14.9h-15.8z"/>
      </svg>
    `

    // Document info
    const info = document.createElement('div')
    info.classList.add('docx-tool__info')
    info.innerHTML = `
      <div class="docx-tool__name">${this.data!.name}</div>
      <div class="docx-tool__meta">
        <span>${this.formatFileSize(this.data!.size)}</span>
        <span>•</span>
        <span>${new Date(this.data!.uploadedAt).toLocaleDateString()}</span>
      </div>
    `

    // Action buttons
    const actions = document.createElement('div')
    actions.classList.add('docx-tool__actions')

    const viewBtn = document.createElement('button')
    viewBtn.textContent = 'View Document'
    viewBtn.classList.add('docx-tool__btn', 'docx-tool__btn--primary')
    viewBtn.onclick = () => {
      this.openDocumentModal()
    }

    const downloadBtn = document.createElement('a')
    downloadBtn.href = this.data!.url
    downloadBtn.download = this.data!.name
    downloadBtn.textContent = 'Download'
    downloadBtn.classList.add('docx-tool__btn')

    actions.appendChild(viewBtn)
    actions.appendChild(downloadBtn)

    if (!this.readOnly) {
      const removeBtn = document.createElement('button')
      removeBtn.textContent = 'Remove'
      removeBtn.classList.add('docx-tool__btn', 'docx-tool__btn--danger')
      removeBtn.onclick = () => {
        this.data = null
        this.rerender()
      }
      actions.appendChild(removeBtn)
    }

    preview.appendChild(icon)
    preview.appendChild(info)
    preview.appendChild(actions)

    return preview
  }

  createUploadArea() {
    const uploadArea = document.createElement('div')
    uploadArea.classList.add('docx-tool__upload-area')
    uploadArea.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>Click to upload or drag and drop</p>
      <p class="docx-tool__hint">DOCX, DOC, PDF (max 10MB)</p>
    `

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'
    fileInput.style.display = 'none'

    fileInput.onchange = async () => {
      if (fileInput.files && fileInput.files.length > 0) {
        await this.handleFileUpload(fileInput.files[0])
      }
    }

    uploadArea.onclick = () => {
      fileInput.click()
    }

    // Drag & drop support
    uploadArea.ondragover = (e) => {
      e.preventDefault()
      uploadArea.classList.add('docx-tool__upload-area--dragover')
    }

    uploadArea.ondragleave = () => {
      uploadArea.classList.remove('docx-tool__upload-area--dragover')
    }

    uploadArea.ondrop = async (e) => {
      e.preventDefault()
      uploadArea.classList.remove('docx-tool__upload-area--dragover')

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        await this.handleFileUpload(files[0])
      }
    }

    uploadArea.appendChild(fileInput)

    return uploadArea
  }

  async handleFileUpload(file: File) {
    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB')
      return
    }

    const validTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(doc|docx|pdf)$/i)) {
      alert('Invalid file type. Please upload DOC, DOCX, or PDF files')
      return
    }

    try {
      // Show loading state
      if (this.wrapper) {
        this.wrapper.innerHTML = '<div class="docx-tool__loading">Uploading...</div>'
      }

      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/upload/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      this.data = {
        url: data.url,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }

      this.rerender()
    } catch (error) {
      console.error('Document upload error:', error)
      alert('Failed to upload document')
      this.rerender()
    }
  }

  openDocumentModal() {
    // Dispatch custom event to open modal
    // The modal component will listen for this event
    const event = new CustomEvent('openDocxModal', {
      detail: {
        url: this.data!.url,
        name: this.data!.name,
      },
    })
    window.dispatchEvent(event)
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  rerender() {
    if (this.wrapper) {
      const newWrapper = this.render()
      this.wrapper.replaceWith(newWrapper)
    }
  }

  save() {
    return this.data
  }

  addStyles() {
    if (document.getElementById('docx-tool-styles')) return

    const style = document.createElement('style')
    style.id = 'docx-tool-styles'
    style.textContent = `
      .docx-tool {
        margin: 1rem 0;
      }

      .docx-tool__preview {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 0.5rem;
      }

      .docx-tool__icon {
        color: var(--primary);
        flex-shrink: 0;
      }

      .docx-tool__info {
        flex: 1;
      }

      .docx-tool__name {
        font-weight: 600;
        color: var(--foreground);
        margin-bottom: 0.25rem;
      }

      .docx-tool__meta {
        font-size: 0.875rem;
        color: var(--muted-foreground);
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .docx-tool__actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .docx-tool__btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--background);
        color: var(--foreground);
        cursor: pointer;
        font-weight: 500;
        font-size: 0.875rem;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-block;
      }

      .docx-tool__btn:hover {
        background: var(--muted);
      }

      .docx-tool__btn--primary {
        background: var(--primary);
        color: var(--primary-foreground);
        border-color: var(--primary);
      }

      .docx-tool__btn--primary:hover {
        opacity: 0.9;
      }

      .docx-tool__btn--danger {
        color: #ef4444;
        border-color: #ef4444;
      }

      .docx-tool__btn--danger:hover {
        background: #fef2f2;
      }

      .docx-tool__upload-area {
        border: 2px dashed var(--border);
        border-radius: 0.5rem;
        padding: 3rem 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--muted-foreground);
      }

      .docx-tool__upload-area:hover {
        border-color: var(--primary);
        background: var(--muted);
      }

      .docx-tool__upload-area--dragover {
        border-color: var(--primary);
        background: var(--primary-foreground);
      }

      .docx-tool__upload-area svg {
        margin: 0 auto 1rem;
      }

      .docx-tool__upload-area p {
        margin: 0.5rem 0;
        color: var(--foreground);
      }

      .docx-tool__hint {
        font-size: 0.875rem;
        color: var(--muted-foreground) !important;
      }

      .docx-tool__loading {
        padding: 2rem;
        text-align: center;
        color: var(--muted-foreground);
      }
    `
    document.head.appendChild(style)
  }

  static get isReadOnlySupported() {
    return true
  }
}
