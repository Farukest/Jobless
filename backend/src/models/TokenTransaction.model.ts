import mongoose, { Document, Schema } from 'mongoose'

export interface ITokenTransaction extends Document {
  userId: mongoose.Types.ObjectId

  transactionType: 'reward' | 'airdrop' | 'presale' | 'stake' | 'claim' | 'transfer'

  amount: number
  tokenSymbol: string

  walletAddress: string

  // Blockchain
  chainId: number
  txHash?: string
  blockNumber?: number

  // Smart Contract
  contractAddress: string

  // Related Activity
  relatedModule?: 'j_info' | 'j_studio' | 'j_alpha' | 'j_hub' | 'j_academy'
  relatedEntityId?: mongoose.Types.ObjectId

  status: 'pending' | 'processing' | 'completed' | 'failed'

  processedAt?: Date

  errorMessage?: string
}

const TokenTransactionSchema = new Schema<ITokenTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['reward', 'airdrop', 'presale', 'stake', 'claim', 'transfer'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    tokenSymbol: {
      type: String,
      required: true,
      default: 'JOBLESS',
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },

    // Blockchain
    chainId: {
      type: Number,
      required: true,
      default: 8453, // Base mainnet
    },
    txHash: {
      type: String,
      sparse: true,
    },
    blockNumber: Number,

    // Smart Contract
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
    },

    // Related Activity
    relatedModule: {
      type: String,
      enum: ['j_info', 'j_studio', 'j_alpha', 'j_hub', 'j_academy'],
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },

    processedAt: Date,

    errorMessage: String,
  },
  {
    timestamps: true,
  }
)

// Indexes
TokenTransactionSchema.index({ userId: 1, createdAt: -1 })
TokenTransactionSchema.index({ walletAddress: 1, status: 1 })
TokenTransactionSchema.index({ txHash: 1 })
TokenTransactionSchema.index({ status: 1, createdAt: -1 })
TokenTransactionSchema.index({ chainId: 1, contractAddress: 1 })

export const TokenTransaction = mongoose.model<ITokenTransaction>('TokenTransaction', TokenTransactionSchema)
