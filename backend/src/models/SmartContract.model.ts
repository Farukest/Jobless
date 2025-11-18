import mongoose, { Document, Schema } from 'mongoose'

export interface ISmartContract extends Document {
  name: string
  contractType: 'token' | 'distribution' | 'staking' | 'presale' | 'other'

  chainId: number
  chainName: string
  contractAddress: string

  abi: any

  deployedBy: mongoose.Types.ObjectId
  deployedAt: Date
  deployTxHash: string

  isActive: boolean

  metadata: any
}

const SmartContractSchema = new Schema<ISmartContract>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contractType: {
      type: String,
      required: true,
      enum: ['token', 'distribution', 'staking', 'presale', 'other'],
    },
    chainId: {
      type: Number,
      required: true,
      default: 8453, // Base mainnet
    },
    chainName: {
      type: String,
      required: true,
      default: 'Base',
    },
    contractAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    abi: {
      type: Schema.Types.Mixed,
      required: true,
    },
    deployedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deployedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deployTxHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
SmartContractSchema.index({ contractAddress: 1 })
SmartContractSchema.index({ chainId: 1, contractType: 1 })
SmartContractSchema.index({ isActive: 1 })
SmartContractSchema.index({ deployedBy: 1 })

export const SmartContract = mongoose.model<ISmartContract>('SmartContract', SmartContractSchema)
