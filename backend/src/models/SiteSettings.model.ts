import mongoose, { Document, Schema } from 'mongoose'

export interface ISiteSettings extends Document {
  header: {
    logoUrl: string
    logoText: string
    navigationItems: Array<{
      label: string
      url: string
      order: number
      isExternal: boolean
      showForRoles: string[]
    }>
  }

  footer: {
    logoUrl: string
    description: string
    socialLinks: Array<{
      platform: string
      url: string
      icon: string
    }>
    footerLinks: Array<{
      title: string
      links: Array<{
        label: string
        url: string
      }>
    }>
  }

  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    customCSS?: string
  }

  modules: {
    jHub: {
      enabled: boolean
      requiredRoles: string[]
      settings: any
    }
    jStudio: {
      enabled: boolean
      requiredRoles: string[]
      settings: any
    }
    jCenter: {
      enabled: boolean
      settings: any
    }
    jAcademy: {
      enabled: boolean
      requiredRoles: string[]
      settings: any
    }
    jInfo: {
      enabled: boolean
      requiredRoles: string[]
      settings: any
    }
    jAlpha: {
      enabled: boolean
      requiredRoles: string[]
      settings: any
    }
  }

  siteName: string
  siteDescription: string
  maintenanceMode: boolean

  updatedBy?: mongoose.Types.ObjectId
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    header: {
      logoUrl: { type: String, default: '' },
      logoText: { type: String, default: 'Jobless' },
      navigationItems: [
        {
          label: String,
          url: String,
          order: Number,
          isExternal: { type: Boolean, default: false },
          showForRoles: [String],
        },
      ],
    },
    footer: {
      logoUrl: String,
      description: { type: String, default: 'Comprehensive Web3 Ecosystem Platform' },
      socialLinks: [
        {
          platform: String,
          url: String,
          icon: String,
        },
      ],
      footerLinks: [
        {
          title: String,
          links: [
            {
              label: String,
              url: String,
            },
          ],
        },
      ],
    },
    theme: {
      primaryColor: { type: String, default: '#000000' },
      secondaryColor: { type: String, default: '#ffffff' },
      accentColor: { type: String, default: '#0066ff' },
      customCSS: String,
    },
    modules: {
      jHub: {
        enabled: { type: Boolean, default: true },
        requiredRoles: { type: [String], default: ['member'] },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      jStudio: {
        enabled: { type: Boolean, default: true },
        requiredRoles: { type: [String], default: ['member'] },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      jCenter: {
        enabled: { type: Boolean, default: true },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      jAcademy: {
        enabled: { type: Boolean, default: true },
        requiredRoles: { type: [String], default: ['member'] },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      jInfo: {
        enabled: { type: Boolean, default: true },
        requiredRoles: { type: [String], default: ['member'] },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
      jAlpha: {
        enabled: { type: Boolean, default: true },
        requiredRoles: { type: [String], default: ['member'] },
        settings: { type: Schema.Types.Mixed, default: {} },
      },
    },
    siteName: { type: String, default: 'Jobless Ecosystem' },
    siteDescription: { type: String, default: 'Comprehensive Web3 Ecosystem Platform' },
    maintenanceMode: { type: Boolean, default: false },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

export const SiteSettings = mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)
