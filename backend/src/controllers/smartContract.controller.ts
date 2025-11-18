import { Response } from 'express'
import { SmartContract } from '../models/SmartContract.model'
import { AppError, asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const deployContract = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deployedBy = req.user._id
  const { name, contractType, contractAddress, abi, deployTxHash, chainId, chainName, metadata } = req.body

  const existing = await SmartContract.findOne({ contractAddress })
  if (existing) {
    throw new AppError('Contract already registered', 400)
  }

  const contract = await SmartContract.create({
    name,
    contractType,
    chainId: chainId || 8453,
    chainName: chainName || 'Base',
    contractAddress,
    abi,
    deployedBy,
    deployTxHash,
    metadata,
  })

  res.status(201).json({
    success: true,
    data: contract,
  })
})

export const getAllContracts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters: any = {}
  if (req.query.contractType) filters.contractType = req.query.contractType
  if (req.query.chainId) filters.chainId = parseInt(req.query.chainId as string)
  if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true'

  const contracts = await SmartContract.find(filters)
    .populate('deployedBy', 'displayName twitterUsername')
    .sort({ deployedAt: -1 })

  res.status(200).json({
    success: true,
    count: contracts.length,
    data: contracts,
  })
})

export const getContract = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { address } = req.params

  const contract = await SmartContract.findOne({ contractAddress: address.toLowerCase() }).populate(
    'deployedBy',
    'displayName twitterUsername'
  )

  if (!contract) {
    throw new AppError('Contract not found', 404)
  }

  res.status(200).json({
    success: true,
    data: contract,
  })
})

export const updateContract = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { address } = req.params
  const updates = req.body

  const contract = await SmartContract.findOneAndUpdate(
    { contractAddress: address.toLowerCase() },
    updates,
    { new: true }
  )

  if (!contract) {
    throw new AppError('Contract not found', 404)
  }

  res.status(200).json({
    success: true,
    data: contract,
  })
})
