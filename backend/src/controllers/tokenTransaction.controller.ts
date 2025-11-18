import { Response } from 'express'
import { TokenTransaction } from '../models/TokenTransaction.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const { transactionType, amount, walletAddress, contractAddress, relatedModule, relatedEntityId } = req.body

  const transaction = await TokenTransaction.create({
    userId,
    transactionType,
    amount,
    tokenSymbol: 'JOBLESS',
    walletAddress: walletAddress || req.user.walletAddress,
    chainId: 8453,
    contractAddress,
    relatedModule,
    relatedEntityId,
  })

  res.status(201).json({
    success: true,
    data: transaction,
  })
})

export const getUserTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId || req.user._id
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const filters: any = { userId }
  if (req.query.status) filters.status = req.query.status
  if (req.query.transactionType) filters.transactionType = req.query.transactionType

  const transactions = await TokenTransaction.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await TokenTransaction.countDocuments(filters)

  res.status(200).json({
    success: true,
    count: transactions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: transactions,
  })
})

export const updateTransactionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status, txHash, blockNumber, errorMessage } = req.body

  const transaction = await TokenTransaction.findByIdAndUpdate(
    id,
    {
      status,
      txHash,
      blockNumber,
      errorMessage,
      processedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
    },
    { new: true }
  )

  if (!transaction) {
    throw new AppError('Transaction not found', 404)
  }

  res.status(200).json({
    success: true,
    data: transaction,
  })
})
