'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface EditRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  role: any
  availableContentTypes: string[]
}

export function EditRoleModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  availableContentTypes,
}: EditRoleModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    allowedContentTypes: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (role) {
      setFormData({
        displayName: role.displayName || '',
        description: role.description || '',
        allowedContentTypes: role.allowedContentTypes || [],
      })
    }
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    try {
      setIsSubmitting(true)

      await api.put(`/roles/${role._id}`, {
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || undefined,
        allowedContentTypes: formData.allowedContentTypes,
      })

      toast.success('Role updated successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error updating role:', err)
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      allowedContentTypes: prev.allowedContentTypes.includes(type)
        ? prev.allowedContentTypes.filter(t => t !== type)
        : [...prev.allowedContentTypes, type],
    }))
  }

  if (!isOpen || !role) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Edit Role: {role.name}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter role display name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter role description"
                rows={3}
              />
            </div>

            {/* Allowed Content Types */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Allowed Content Types
                <span className="text-xs text-muted-foreground ml-2">(Select which content types this role can create)</span>
              </label>
              {availableContentTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading content types...</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableContentTypes.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.allowedContentTypes.includes(type)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.allowedContentTypes.includes(type)}
                        onChange={() => toggleContentType(type)}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {formData.allowedContentTypes.length === 0
                  ? 'No content types selected - users with this role cannot create content'
                  : `${formData.allowedContentTypes.length} content type(s) selected`}
              </p>
            </div>

            {/* System Role Warning */}
            {role.isSystemRole && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ This is a system role. Some properties cannot be modified.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
