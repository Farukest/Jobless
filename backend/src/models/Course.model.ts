import mongoose, { Document, Schema } from 'mongoose'

export interface ICourse extends Document {
  mentorId: mongoose.Types.ObjectId

  title: string
  description: string
  shortDescription: string

  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'

  thumbnailUrl?: string

  modules: Array<{
    title: string
    description: string
    order: number
    lessons: Array<{
      title: string
      contentType: 'video' | 'text' | 'quiz' | 'assignment'
      contentUrl: string
      duration: number
      order: number
    }>
  }>

  duration: number
  language: string
  prerequisites: string[]

  enrolledCount: number
  completedCount: number

  likesCount: number
  bookmarksCount: number
  viewsCount: number

  isLiveSession: boolean
  sessionDate?: Date
  sessionLink?: string
  maxParticipants?: number

  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date

  averageRating: number
  reviewsCount: number
}

const CourseSchema = new Schema<ICourse>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    category: {
      type: String,
      required: true,
      enum: ['design', 'video_editing', 'crypto_twitter', 'defi', 'node_setup', 'ai_tools', 'trading', 'development', 'other'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    thumbnailUrl: String,
    modules: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        order: {
          type: Number,
          required: true,
        },
        lessons: [
          {
            title: {
              type: String,
              required: true,
            },
            contentType: {
              type: String,
              required: true,
              enum: ['video', 'text', 'quiz', 'assignment'],
            },
            contentUrl: {
              type: String,
              required: true,
            },
            duration: Number,
            order: {
              type: Number,
              required: true,
            },
          },
        ],
      },
    ],
    duration: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: 'en',
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    isLiveSession: {
      type: Boolean,
      default: false,
    },
    sessionDate: Date,
    sessionLink: String,
    maxParticipants: Number,
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: Date,
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
CourseSchema.index({ mentorId: 1, status: 1 })
CourseSchema.index({ status: 1, publishedAt: -1 })
CourseSchema.index({ category: 1, difficulty: 1 })

export const Course = mongoose.model<ICourse>('Course', CourseSchema)

// CourseEnrollment Interface and Schema
export interface ICourseEnrollment extends Document {
  courseId: mongoose.Types.ObjectId
  learnerId: mongoose.Types.ObjectId

  status: 'active' | 'completed' | 'dropped'
  enrolledAt: Date
  completedAt?: Date

  progress: number
  currentModule?: number
  currentLesson?: number

  completedLessons: mongoose.Types.ObjectId[]

  lastAccessedAt: Date
  certificateIssued: boolean

  rating?: number
  review?: string
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    learnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currentModule: Number,
    currentLesson: Number,
    completedLessons: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
  },
  {
    timestamps: true,
  }
)

// Indexes
CourseEnrollmentSchema.index({ courseId: 1, learnerId: 1 }, { unique: true })
CourseEnrollmentSchema.index({ learnerId: 1, status: 1 })

export const CourseEnrollment = mongoose.model<ICourseEnrollment>('CourseEnrollment', CourseEnrollmentSchema)

// CourseRequest Interface and Schema
export interface ICourseRequest extends Document {
  requesterId: mongoose.Types.ObjectId

  title: string
  description: string
  category: string

  votes: number
  voters: mongoose.Types.ObjectId[]

  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'

  approvedBy?: mongoose.Types.ObjectId
  approvedAt?: Date

  assignedMentor?: mongoose.Types.ObjectId
  assignedAt?: Date

  courseId?: mongoose.Types.ObjectId
  completedAt?: Date
}

const CourseRequestSchema = new Schema<ICourseRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['design', 'video_editing', 'crypto_twitter', 'defi', 'node_setup', 'ai_tools', 'trading', 'development', 'other'],
    },
    votes: {
      type: Number,
      default: 0,
    },
    voters: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    assignedMentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: Date,
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes
CourseRequestSchema.index({ status: 1, votes: -1 })
CourseRequestSchema.index({ requesterId: 1, status: 1 })

export const CourseRequest = mongoose.model<ICourseRequest>('CourseRequest', CourseRequestSchema)
