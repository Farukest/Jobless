import { Response } from 'express'
import { UserStats } from '../models/UserStats.model'
import { asyncHandler } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'

export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId || req.user._id

  let stats = await UserStats.findOne({ userId })

  if (!stats) {
    stats = await UserStats.create({ userId })
  }

  const overall = {
    jRankPoints: req.user.jRankPoints || 0,
    contributionScore: req.user.contributionScore || 0,
  }

  res.status(200).json({
    success: true,
    data: {
      overall,
      jHub: {
        contentsCreated: stats.hubContentsCreated,
        contentsViewed: stats.hubContentsViewed,
      },
      jStudio: {
        requestsSubmitted: stats.studioRequestsSubmitted,
        requestsCompleted: stats.studioRequestsCompleted,
        tasksCompleted: stats.studioTasksCompleted,
      },
      jAcademy: {
        coursesCreated: stats.coursesCreated,
        coursesCompleted: stats.coursesCompleted,
        coursesRequested: stats.coursesRequested,
      },
      jInfo: {
        tweetsSubmitted: stats.tweetsSubmitted,
        engagementsGiven: stats.interactionsGiven,
        engagementsReceived: stats.interactionsReceived,
      },
      jAlpha: {
        alphasSubmitted: stats.alphasSubmitted,
        alphasValidated: stats.alphasValidated,
        votesGiven: stats.votesGiven,
      },
    },
  })
})

export const updateUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const updates = req.body

  const stats = await UserStats.findOneAndUpdate({ userId }, { $inc: updates }, { new: true, upsert: true })

  res.status(200).json({
    success: true,
    data: stats,
  })
})
