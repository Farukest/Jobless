/**
 * Custom EditorJS Image Slide Tool
 * Supports max 3 images per slide with horizontal scroll
 * Supports URL, upload, and drag & drop
 */

import { api } from '@/lib/api'

interface ImageData {
  url: string
  caption?: string
}

interface ImageSlideData {
  images: ImageData[]
}

export class ImageSlideTool {
  api: any
  readOnly: boolean
  data: ImageSlideData
  wrapper: HTMLElement | null = null
  maxImages = 3

  static get toolbox() {
    return {
      title: 'Image Slide',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
    }
  }

  constructor({ data, api, readOnly }: any) {
    this.api = api
    this.readOnly = readOnly
    this.data = {
      images: data.images || [],
    }
  }

  render() {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('image-slide-tool')

    // Container for images
    const imageContainer = document.createElement('div')
    imageContainer.classList.add('image-slide-tool__container')

    // Render existing images
    this.data.images.forEach((imageData, index) => {
      const imageBlock = this.createImageBlock(imageData, index)
      imageContainer.appendChild(imageBlock)
    })

    // Add button (if not at max)
    if (this.data.images.length < this.maxImages && !this.readOnly) {
      const addButton = this.createAddButton()
      imageContainer.appendChild(addButton)
    }

    this.wrapper.appendChild(imageContainer)

    // Add styles
    this.addStyles()

    return this.wrapper
  }

  createImageBlock(imageData: ImageData, index: number) {
    const block = document.createElement('div')
    block.classList.add('image-slide-tool__image-block')

    // Image
    const img = document.createElement('img')
    img.src = imageData.url
    img.alt = imageData.caption || ''
    img.classList.add('image-slide-tool__image')

    // Remove button
    if (!this.readOnly) {
      const removeBtn = document.createElement('button')
      removeBtn.innerHTML = '×'
      removeBtn.classList.add('image-slide-tool__remove')
      removeBtn.onclick = () => {
        this.removeImage(index)
      }
      block.appendChild(removeBtn)
    }

    // Caption
    const caption = document.createElement('input')
    caption.type = 'text'
    caption.placeholder = 'Add caption...'
    caption.value = imageData.caption || ''
    caption.classList.add('image-slide-tool__caption')
    caption.disabled = this.readOnly
    caption.oninput = (e) => {
      this.data.images[index].caption = (e.target as HTMLInputElement).value
    }

    block.appendChild(img)
    block.appendChild(caption)

    return block
  }

  createAddButton() {
    const addBtn = document.createElement('div')
    addBtn.classList.add('image-slide-tool__add-btn')
    addBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Add Image</span>
    `

    addBtn.onclick = () => {
      this.showImageInput()
    }

    // Drag & drop support
    addBtn.ondragover = (e) => {
      e.preventDefault()
      addBtn.classList.add('image-slide-tool__add-btn--dragover')
    }

    addBtn.ondragleave = () => {
      addBtn.classList.remove('image-slide-tool__add-btn--dragover')
    }

    addBtn.ondrop = async (e) => {
      e.preventDefault()
      addBtn.classList.remove('image-slide-tool__add-btn--dragover')

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        await this.handleFileUpload(files[0])
      }
    }

    return addBtn
  }

  showImageInput() {
    const modal = document.createElement('div')
    modal.classList.add('image-slide-tool__modal')
    modal.innerHTML = `
      <div class="image-slide-tool__modal-content">
        <h3>Add Image</h3>
        <div class="image-slide-tool__input-group">
          <input type="text" placeholder="Paste image URL" class="image-slide-tool__url-input" />
          <button class="image-slide-tool__btn image-slide-tool__btn--primary url-btn">Add from URL</button>
        </div>
        <div class="image-slide-tool__divider">or</div>
        <div class="image-slide-tool__input-group">
          <input type="file" accept="image/*" class="image-slide-tool__file-input" style="display:none" />
          <button class="image-slide-tool__btn upload-btn">Upload Image</button>
        </div>
        <button class="image-slide-tool__btn image-slide-tool__btn--secondary cancel-btn">Cancel</button>
      </div>
    `

    document.body.appendChild(modal)

    // Event handlers
    const urlInput = modal.querySelector('.image-slide-tool__url-input') as HTMLInputElement
    const urlBtn = modal.querySelector('.url-btn') as HTMLButtonElement
    const fileInput = modal.querySelector('.image-slide-tool__file-input') as HTMLInputElement
    const uploadBtn = modal.querySelector('.upload-btn') as HTMLButtonElement
    const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement

    urlBtn.onclick = () => {
      const url = urlInput.value.trim()
      if (url) {
        this.addImage({ url })
        document.body.removeChild(modal)
      }
    }

    uploadBtn.onclick = () => {
      fileInput.click()
    }

    fileInput.onchange = async () => {
      if (fileInput.files && fileInput.files.length > 0) {
        await this.handleFileUpload(fileInput.files[0])
        document.body.removeChild(modal)
      }
    }

    cancelBtn.onclick = () => {
      document.body.removeChild(modal)
    }

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    }
  }

  async handleFileUpload(file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      this.addImage({ url: data.url })
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image')
    }
  }

  addImage(imageData: ImageData) {
    if (this.data.images.length >= this.maxImages) {
      alert(`Maximum ${this.maxImages} images allowed per slide`)
      return
    }

    this.data.images.push(imageData)
    this.rerender()
  }

  removeImage(index: number) {
    this.data.images.splice(index, 1)
    this.rerender()
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
    if (document.getElementById('image-slide-tool-styles')) return

    const style = document.createElement('style')
    style.id = 'image-slide-tool-styles'
    style.textContent = `
      .image-slide-tool__container {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        padding: 0.5rem 0;
      }

      .image-slide-tool__image-block {
        position: relative;
        min-width: 250px;
        max-width: 250px;
        flex-shrink: 0;
      }

      .image-slide-tool__image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
      }

      .image-slide-tool__remove {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 28px;
        height: 28px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      .image-slide-tool__remove:hover {
        background: rgba(255, 0, 0, 0.8);
      }

      .image-slide-tool__caption {
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--background);
        color: var(--foreground);
        font-size: 0.875rem;
      }

      .image-slide-tool__add-btn {
        min-width: 250px;
        height: 200px;
        border: 2px dashed var(--border);
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--muted-foreground);
      }

      .image-slide-tool__add-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--muted);
      }

      .image-slide-tool__add-btn--dragover {
        border-color: var(--primary);
        background: var(--primary-foreground);
      }

      /* Modal */
      .image-slide-tool__modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .image-slide-tool__modal-content {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        padding: 1.5rem;
        max-width: 500px;
        width: 90%;
      }

      .image-slide-tool__modal-content h3 {
        margin: 0 0 1rem 0;
        color: var(--foreground);
        font-size: 1.25rem;
        font-weight: 600;
      }

      .image-slide-tool__input-group {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .image-slide-tool__url-input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--background);
        color: var(--foreground);
      }

      .image-slide-tool__btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--background);
        color: var(--foreground);
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .image-slide-tool__btn:hover {
        background: var(--muted);
      }

      .image-slide-tool__btn--primary {
        background: var(--primary);
        color: var(--primary-foreground);
        border-color: var(--primary);
      }

      .image-slide-tool__btn--primary:hover {
        opacity: 0.9;
      }

      .image-slide-tool__btn--secondary {
        width: 100%;
        margin-top: 0.5rem;
      }

      .image-slide-tool__divider {
        text-align: center;
        color: var(--muted-foreground);
        margin: 1rem 0;
        font-size: 0.875rem;
      }
    `
    document.head.appendChild(style)
  }

  static get isReadOnlySupported() {
    return true
  }
}
