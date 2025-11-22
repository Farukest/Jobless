import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Badge } from '../models/Badge.model'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

const badges = [
  // ============================================
  // MEMBER BADGES (15)
  // ============================================
  {
    name: 'rookie',
    displayName: 'Rookie',
    description: 'Welcome to Jobless! Your journey begins here.',
    iconName: 'RookieBadge',
    color: '#6B7280',
    animationType: 'pulse',
    type: 'role',
    category: 'general',
    requiredRoles: ['member'],
    rarity: 'common',
    tier: 'entry',
    order: 1
  },
  {
    name: 'explorer',
    displayName: 'Explorer',
    description: 'Visited 3 different modules',
    iconName: 'ExplorerBadge',
    color: '#60A5FA',
    animationType: 'rotate',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'days_active',
      target: 1,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'connected',
    displayName: 'Connected',
    description: 'Connected both wallet and Twitter',
    iconName: 'ConnectedBadge',
    color: '#34D399',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'general',
    rarity: 'common',
    tier: 'entry',
    order: 3
  },
  {
    name: 'active_member',
    displayName: 'Active Member',
    description: 'Logged in for 7 consecutive days',
    iconName: 'ActiveMemberBadge',
    color: '#818CF8',
    animationType: 'pulse',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'days_active',
      target: 7,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'progress',
    order: 4
  },
  {
    name: 'profile_complete',
    displayName: 'Profile Complete',
    description: 'Filled out your complete profile',
    iconName: 'ProfileCompleteBadge',
    color: '#8B5CF6',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'general',
    rarity: 'common',
    tier: 'progress',
    order: 6
  },
  {
    name: 'point_collector',
    displayName: 'Point Collector',
    description: 'Earned your first 100 J-Rank Points',
    iconName: 'PointCollectorBadge',
    color: '#FBBF24',
    animationType: 'bounce',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'jrank_points',
      target: 100,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'progress',
    order: 7
  },
  {
    name: 'veteran',
    displayName: 'Veteran',
    description: '30 days of membership',
    iconName: 'VeteranBadge',
    color: '#F59E0B',
    animationType: 'glow',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'days_active',
      target: 30,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 8
  },
  {
    name: 'point_master',
    displayName: 'Point Master',
    description: 'Reached 1000 J-Rank Points',
    iconName: 'PointMasterBadge',
    color: '#EF4444',
    animationType: 'glow',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'jrank_points',
      target: 1000,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 9
  },
  {
    name: 'contributor',
    displayName: 'Contributor',
    description: 'Achieved 500+ contribution score',
    iconName: 'ContributorBadge',
    color: '#06B6D4',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'contribution_score',
      target: 500,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 10
  },
  {
    name: 'elite_member',
    displayName: 'Elite Member',
    description: '90 days of membership with 2500+ points',
    iconName: 'EliteMemberBadge',
    color: '#A855F7',
    animationType: 'float',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'days_active',
      target: 90,
      operator: 'gte',
      additionalCriteria: { jrank_points: 2500 }
    },
    rarity: 'epic',
    tier: 'elite',
    order: 11
  },
  {
    name: 'platform_champion',
    displayName: 'Platform Champion',
    description: 'Reached 5000+ contribution score',
    iconName: 'PlatformChampionBadge',
    color: '#10B981',
    animationType: 'glow',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'contribution_score',
      target: 5000,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'elite',
    order: 12
  },
  {
    name: 'legend',
    displayName: 'Legend',
    description: 'One year of dedication with 10,000 points',
    iconName: 'LegendBadge',
    color: '#F59E0B',
    animationType: 'divine',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'days_active',
      target: 365,
      operator: 'gte',
      additionalCriteria: { jrank_points: 10000 }
    },
    rarity: 'legendary',
    tier: 'legendary',
    order: 13
  },
  {
    name: 'early_adopter',
    displayName: 'Early Adopter',
    description: 'One of the first 1000 members',
    iconName: 'EarlyAdopterBadge',
    color: '#3B82F6',
    animationType: 'sparkle',
    type: 'special',
    category: 'general',
    criteria: {
      type: 'user_id_threshold',
      target: 1000,
      operator: 'lt'
    },
    rarity: 'epic',
    tier: 'special',
    order: 14
  },
  {
    name: 'anniversary',
    displayName: 'Anniversary',
    description: 'Celebrating 1 year with Jobless',
    iconName: 'AnniversaryBadge',
    color: '#EC4899',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'general',
    criteria: {
      type: 'days_active',
      target: 365,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'special',
    order: 15
  },

  // ============================================
  // CONTENT CREATOR BADGES (20)
  // ============================================
  {
    name: 'first_post',
    displayName: 'First Post',
    description: 'Published your first content',
    iconName: 'FirstPostBadge',
    color: '#6366F1',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 1,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'entry',
    order: 1
  },
  {
    name: 'video_starter',
    displayName: 'Video Starter',
    description: 'Created your first video',
    iconName: 'VideoStarterBadge',
    color: '#EF4444',
    animationType: 'pulse',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 1,
      operator: 'gte',
      contentType: 'video'
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'thread_weaver',
    displayName: 'Thread Weaver',
    description: 'Posted your first thread',
    iconName: 'ThreadWeaverBadge',
    color: '#3B82F6',
    animationType: 'wave',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 1,
      operator: 'gte',
      contentType: 'thread'
    },
    rarity: 'common',
    tier: 'entry',
    order: 3
  },
  {
    name: 'podcast_pioneer',
    displayName: 'Podcast Pioneer',
    description: 'Published your first podcast',
    iconName: 'PodcastPioneerBadge',
    color: '#8B5CF6',
    animationType: 'wave',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 1,
      operator: 'gte',
      contentType: 'podcast'
    },
    rarity: 'common',
    tier: 'entry',
    order: 4
  },
  {
    name: 'consistent_creator',
    displayName: 'Consistent Creator',
    description: 'Published 5 pieces of content',
    iconName: 'ConsistentCreatorBadge',
    color: '#F97316',
    animationType: 'flash',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 5,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'progress',
    order: 5
  },
  {
    name: 'popular_post',
    displayName: 'Popular Post',
    description: 'Received 50+ likes on a single post',
    iconName: 'PopularPostBadge',
    color: '#EC4899',
    animationType: 'glow',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'like_count',
      target: 50,
      operator: 'gte',
      additionalCriteria: { single: true }
    },
    rarity: 'rare',
    tier: 'progress',
    order: 6
  },
  {
    name: 'multi_format',
    displayName: 'Multi-Format Creator',
    description: 'Created content in all formats',
    iconName: 'MultiFormatBadge',
    color: '#A855F7',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'hub',
    rarity: 'rare',
    tier: 'progress',
    order: 9
  },
  {
    name: 'prolific',
    displayName: 'Prolific',
    description: 'Published 20 pieces of content',
    iconName: 'ProlificBadge',
    color: '#F59E0B',
    animationType: 'bounce',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 20,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'progress',
    order: 10
  },
  {
    name: 'viral_hit',
    displayName: 'Viral Hit',
    description: '100+ likes on a single post',
    iconName: 'ViralHitBadge',
    color: '#EF4444',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'like_count',
      target: 100,
      operator: 'gte',
      additionalCriteria: { single: true }
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 11
  },
  {
    name: 'content_master',
    displayName: 'Content Master',
    description: 'Published 50 pieces of content',
    iconName: 'ContentMasterBadge',
    color: '#8B5CF6',
    animationType: 'glow',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 50,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 13
  },
  {
    name: 'content_titan',
    displayName: 'Content Titan',
    description: 'Published 100 pieces of content',
    iconName: 'ContentTitanBadge',
    color: '#06B6D4',
    animationType: 'divine',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 100,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'elite',
    order: 15
  },
  {
    name: 'mega_viral',
    displayName: 'Mega Viral',
    description: '500+ likes on a single post',
    iconName: 'MegaViralBadge',
    color: '#F97316',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'like_count',
      target: 500,
      operator: 'gte',
      additionalCriteria: { single: true }
    },
    rarity: 'legendary',
    tier: 'elite',
    order: 16
  },
  {
    name: 'hub_immortal',
    displayName: 'Hub Immortal',
    description: '500+ published content with 5000+ total likes',
    iconName: 'HubImmortalBadge',
    color: '#FBBF24',
    animationType: 'divine',
    type: 'achievement',
    category: 'hub',
    criteria: {
      type: 'content_count',
      target: 500,
      operator: 'gte',
      additionalCriteria: { like_count: 5000 }
    },
    rarity: 'legendary',
    tier: 'legendary',
    order: 19
  },

  // ============================================
  // DESIGNER BADGES (18)
  // ============================================
  {
    name: 'design_rookie',
    displayName: 'Design Rookie',
    description: 'Claimed your first design request',
    iconName: 'DesignRookieBadge',
    color: '#06B6D4',
    animationType: 'pulse',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 1,
      operator: 'gte',
      additionalCriteria: { requestType: 'claimed' }
    },
    rarity: 'common',
    tier: 'entry',
    order: 1
  },
  {
    name: 'first_delivery',
    displayName: 'First Delivery',
    description: 'Completed your first design',
    iconName: 'FirstDeliveryBadge',
    color: '#10B981',
    animationType: 'bounce',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 1,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'reliable_designer',
    displayName: 'Reliable Designer',
    description: 'Completed 5 design requests',
    iconName: 'ReliableDesignerBadge',
    color: '#3B82F6',
    animationType: 'pulse',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 5,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'common',
    tier: 'progress',
    order: 4
  },
  {
    name: 'client_favorite',
    displayName: "Client's Favorite",
    description: 'Received 10 five-star ratings',
    iconName: 'ClientFavoriteBadge',
    color: '#FBBF24',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'rating_count',
      target: 10,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'progress',
    order: 8
  },
  {
    name: 'studio_pro',
    displayName: 'Studio Pro',
    description: 'Completed 25 design requests',
    iconName: 'StudioProBadge',
    color: '#F97316',
    animationType: 'glow',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 25,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 9
  },
  {
    name: 'design_veteran',
    displayName: 'Design Veteran',
    description: 'Completed 50 design requests',
    iconName: 'DesignVeteranBadge',
    color: '#A855F7',
    animationType: 'rotate',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 50,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 12
  },
  {
    name: 'studio_elite',
    displayName: 'Studio Elite',
    description: 'Completed 100 design requests',
    iconName: 'StudioEliteBadge',
    color: '#8B5CF6',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 100,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'epic',
    tier: 'elite',
    order: 13
  },
  {
    name: 'design_titan',
    displayName: 'Design Titan',
    description: 'Completed 250 design requests',
    iconName: 'DesignTitanBadge',
    color: '#EF4444',
    animationType: 'glow',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 250,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'legendary',
    tier: 'elite',
    order: 15
  },
  {
    name: 'legendary_creator',
    displayName: 'Legendary Creator',
    description: 'Completed 500 design requests',
    iconName: 'LegendaryCreatorBadge',
    color: '#F59E0B',
    animationType: 'divine',
    type: 'achievement',
    category: 'studio',
    criteria: {
      type: 'request_count',
      target: 500,
      operator: 'gte',
      additionalCriteria: { requestType: 'completed' }
    },
    rarity: 'legendary',
    tier: 'legendary',
    order: 16
  },

  // ============================================
  // SCOUT BADGES (17)
  // ============================================
  {
    name: 'first_scout',
    displayName: 'First Scout',
    description: 'Posted your first alpha',
    iconName: 'FirstScoutBadge',
    color: '#FBBF24',
    animationType: 'scan',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 1,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'entry',
    order: 1
  },
  {
    name: 'alpha_hunter',
    displayName: 'Alpha Hunter',
    description: 'Posted 5 alpha discoveries',
    iconName: 'AlphaHunterBadge',
    color: '#EF4444',
    animationType: 'pulse',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 5,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'consistent_scout',
    displayName: 'Consistent Scout',
    description: 'Posted 10 alpha discoveries',
    iconName: 'ConsistentScoutBadge',
    color: '#10B981',
    animationType: 'scan',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 10,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'progress',
    order: 4
  },
  {
    name: 'popular_alpha',
    displayName: 'Popular Alpha',
    description: 'Received 25+ bullish votes on one post',
    iconName: 'PopularAlphaBadge',
    color: '#EF4444',
    animationType: 'flash',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'bullish_count',
      target: 25,
      operator: 'gte',
      additionalCriteria: { single: true }
    },
    rarity: 'rare',
    tier: 'progress',
    order: 5
  },
  {
    name: 'active_scout',
    displayName: 'Active Scout',
    description: 'Posted 25 alpha discoveries',
    iconName: 'ActiveScoutBadge',
    color: '#3B82F6',
    animationType: 'rotate',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 25,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'progress',
    order: 8
  },
  {
    name: 'alpha_pro',
    displayName: 'Alpha Pro',
    description: 'Posted 50 alpha discoveries',
    iconName: 'AlphaProBadge',
    color: '#A855F7',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 50,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 9
  },
  {
    name: 'community_favorite',
    displayName: 'Community Favorite',
    description: '100+ bullish votes on one post',
    iconName: 'CommunityFavoriteBadge',
    color: '#EC4899',
    animationType: 'glow',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'bullish_count',
      target: 100,
      operator: 'gte',
      additionalCriteria: { single: true }
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 10
  },
  {
    name: 'veteran_scout',
    displayName: 'Veteran Scout',
    description: 'Posted 100 alpha discoveries',
    iconName: 'VeteranScoutBadge',
    color: '#F97316',
    animationType: 'glow',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 100,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 12
  },
  {
    name: 'alpha_master',
    displayName: 'Alpha Master',
    description: 'Posted 250 alpha discoveries',
    iconName: 'AlphaMasterBadge',
    color: '#FBBF24',
    animationType: 'divine',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 250,
      operator: 'gte'
    },
    rarity: 'legendary',
    tier: 'elite',
    order: 13
  },
  {
    name: 'legendary_scout',
    displayName: 'Legendary Scout',
    description: 'Posted 500 alpha discoveries',
    iconName: 'LegendaryScoutBadge',
    color: '#F59E0B',
    animationType: 'divine',
    type: 'achievement',
    category: 'alpha',
    criteria: {
      type: 'alpha_count',
      target: 500,
      operator: 'gte'
    },
    rarity: 'legendary',
    tier: 'legendary',
    order: 14
  },

  // ============================================
  // MENTOR BADGES (18)
  // ============================================
  {
    name: 'mentor',
    displayName: 'Mentor',
    description: 'Official J Academy mentor',
    iconName: 'MentorBadge',
    color: '#10B981',
    animationType: 'glow',
    type: 'role',
    category: 'academy',
    requiredRoles: ['mentor'],
    rarity: 'rare',
    tier: 'entry',
    order: 1
  },
  {
    name: 'first_course',
    displayName: 'First Course',
    description: 'Created your first course',
    iconName: 'FirstCourseBadge',
    color: '#3B82F6',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'course_count',
      target: 1,
      operator: 'gte',
      additionalCriteria: { role: 'mentor' }
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'course_starter',
    displayName: 'Course Starter',
    description: 'Created 3 courses',
    iconName: 'CourseStarterBadge',
    color: '#06B6D4',
    animationType: 'pulse',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'course_count',
      target: 3,
      operator: 'gte',
      additionalCriteria: { role: 'mentor' }
    },
    rarity: 'common',
    tier: 'progress',
    order: 3
  },
  {
    name: 'popular_mentor',
    displayName: 'Popular Mentor',
    description: 'Reached 50+ total enrollments',
    iconName: 'PopularMentorBadge',
    color: '#8B5CF6',
    animationType: 'glow',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 50,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'progress',
    order: 5
  },
  {
    name: 'active_mentor',
    displayName: 'Active Mentor',
    description: 'Created 10 courses',
    iconName: 'ActiveMentorBadge',
    color: '#F59E0B',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'course_count',
      target: 10,
      operator: 'gte',
      additionalCriteria: { role: 'mentor' }
    },
    rarity: 'rare',
    tier: 'progress',
    order: 6
  },
  {
    name: 'beloved_mentor',
    displayName: 'Beloved Mentor',
    description: 'Reached 100+ total enrollments',
    iconName: 'BelovedMentorBadge',
    color: '#EC4899',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 100,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 8
  },
  {
    name: 'prolific_mentor',
    displayName: 'Prolific Mentor',
    description: 'Created 25 courses',
    iconName: 'ProlificMentorBadge',
    color: '#A855F7',
    animationType: 'glow',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'course_count',
      target: 25,
      operator: 'gte',
      additionalCriteria: { role: 'mentor' }
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 9
  },
  {
    name: 'master_mentor',
    displayName: 'Master Mentor',
    description: 'Created 50 courses',
    iconName: 'MasterMentorBadge',
    color: '#10B981',
    animationType: 'divine',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'course_count',
      target: 50,
      operator: 'gte',
      additionalCriteria: { role: 'mentor' }
    },
    rarity: 'epic',
    tier: 'elite',
    order: 11
  },
  {
    name: 'celebrity_mentor',
    displayName: 'Celebrity Mentor',
    description: 'Reached 500+ total enrollments',
    iconName: 'CelebrityMentorBadge',
    color: '#FBBF24',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 500,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'elite',
    order: 12
  },
  {
    name: 'legendary_mentor',
    displayName: 'Legendary Mentor',
    description: 'Created 100 courses',
    iconName: 'LegendaryMentorBadge',
    color: '#F59E0B',
    animationType: 'divine',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'course_count',
      target: 100,
      operator: 'gte',
      additionalCriteria: { role: 'mentor' }
    },
    rarity: 'legendary',
    tier: 'legendary',
    order: 14
  },

  // ============================================
  // LEARNER BADGES (15)
  // ============================================
  {
    name: 'learner',
    displayName: 'Learner',
    description: 'Enrolled in J Academy',
    iconName: 'LearnerBadge',
    color: '#60A5FA',
    animationType: 'pulse',
    type: 'role',
    category: 'academy',
    requiredRoles: ['learner'],
    rarity: 'common',
    tier: 'entry',
    order: 1
  },
  {
    name: 'first_enrollment',
    displayName: 'First Enrollment',
    description: 'Enrolled in your first course',
    iconName: 'FirstEnrollmentBadge',
    color: '#3B82F6',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 1,
      operator: 'gte',
      additionalCriteria: { role: 'learner' }
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'first_completion',
    displayName: 'First Completion',
    description: 'Completed your first course',
    iconName: 'FirstCompletionBadge',
    color: '#10B981',
    animationType: 'bounce',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'completion_count',
      target: 1,
      operator: 'gte'
    },
    rarity: 'common',
    tier: 'entry',
    order: 3
  },
  {
    name: 'eager_learner',
    displayName: 'Eager Learner',
    description: 'Enrolled in 5 courses',
    iconName: 'EagerLearnerBadge',
    color: '#8B5CF6',
    animationType: 'pulse',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 5,
      operator: 'gte',
      additionalCriteria: { role: 'learner' }
    },
    rarity: 'common',
    tier: 'progress',
    order: 4
  },
  {
    name: 'dedicated_learner',
    displayName: 'Dedicated Learner',
    description: 'Completed 5 courses',
    iconName: 'DedicatedLearnerBadge',
    color: '#06B6D4',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'completion_count',
      target: 5,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'progress',
    order: 6
  },
  {
    name: 'active_learner',
    displayName: 'Active Learner',
    description: 'Enrolled in 10 courses',
    iconName: 'ActiveLearnerBadge',
    color: '#F97316',
    animationType: 'glow',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 10,
      operator: 'gte',
      additionalCriteria: { role: 'learner' }
    },
    rarity: 'rare',
    tier: 'progress',
    order: 7
  },
  {
    name: 'course_completer',
    displayName: 'Course Completer',
    description: 'Completed 10 courses',
    iconName: 'CourseCompleterBadge',
    color: '#A855F7',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'completion_count',
      target: 10,
      operator: 'gte'
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 9
  },
  {
    name: 'knowledge_seeker',
    displayName: 'Knowledge Seeker',
    description: 'Enrolled in 25 courses',
    iconName: 'KnowledgeSeekerBadge',
    color: '#EC4899',
    animationType: 'glow',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'enrollment_count',
      target: 25,
      operator: 'gte',
      additionalCriteria: { role: 'learner' }
    },
    rarity: 'epic',
    tier: 'mastery',
    order: 10
  },
  {
    name: 'master_student',
    displayName: 'Master Student',
    description: 'Completed 25 courses',
    iconName: 'MasterStudentBadge',
    color: '#10B981',
    animationType: 'divine',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'completion_count',
      target: 25,
      operator: 'gte'
    },
    rarity: 'epic',
    tier: 'elite',
    order: 12
  },
  {
    name: 'eternal_learner',
    displayName: 'Eternal Learner',
    description: 'Completed 50 courses',
    iconName: 'EternalLearnerBadge',
    color: '#FBBF24',
    animationType: 'divine',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'completion_count',
      target: 50,
      operator: 'gte'
    },
    rarity: 'legendary',
    tier: 'legendary',
    order: 14
  },

  // ============================================
  // REQUESTER BADGES (10)
  // ============================================
  {
    name: 'requester',
    displayName: 'Requester',
    description: 'Can request courses in J Academy',
    iconName: 'RequesterBadge',
    color: '#F59E0B',
    animationType: 'pulse',
    type: 'role',
    category: 'academy',
    requiredRoles: ['requester'],
    rarity: 'common',
    tier: 'entry',
    order: 1
  },
  {
    name: 'first_request',
    displayName: 'First Request',
    description: 'Created your first course request',
    iconName: 'FirstRequestBadge',
    color: '#FBBF24',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'request_count',
      target: 1,
      operator: 'gte',
      additionalCriteria: { requestType: 'created' }
    },
    rarity: 'common',
    tier: 'entry',
    order: 2
  },
  {
    name: 'active_requester',
    displayName: 'Active Requester',
    description: 'Created 5 course requests',
    iconName: 'ActiveRequesterBadge',
    color: '#F97316',
    animationType: 'pulse',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'request_count',
      target: 5,
      operator: 'gte',
      additionalCriteria: { requestType: 'created' }
    },
    rarity: 'common',
    tier: 'progress',
    order: 4
  },
  {
    name: 'popular_request',
    displayName: 'Popular Request',
    description: 'One of your requests got 25+ votes',
    iconName: 'PopularRequestBadge',
    color: '#EC4899',
    animationType: 'glow',
    type: 'achievement',
    category: 'academy',
    rarity: 'rare',
    tier: 'progress',
    order: 6
  },
  {
    name: 'prolific_requester',
    displayName: 'Prolific Requester',
    description: 'Created 10 course requests',
    iconName: 'ProlificRequesterBadge',
    color: '#8B5CF6',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'request_count',
      target: 10,
      operator: 'gte',
      additionalCriteria: { requestType: 'created' }
    },
    rarity: 'rare',
    tier: 'mastery',
    order: 8
  },
  {
    name: 'request_fulfilled',
    displayName: 'Request Fulfilled',
    description: 'One of your requests became a course',
    iconName: 'RequestFulfilledBadge',
    color: '#10B981',
    animationType: 'sparkle',
    type: 'achievement',
    category: 'academy',
    rarity: 'epic',
    tier: 'mastery',
    order: 10
  },
  {
    name: 'master_requester',
    displayName: 'Master Requester',
    description: 'Created 25 course requests',
    iconName: 'MasterRequesterBadge',
    color: '#A855F7',
    animationType: 'glow',
    type: 'achievement',
    category: 'academy',
    criteria: {
      type: 'request_count',
      target: 25,
      operator: 'gte',
      additionalCriteria: { requestType: 'created' }
    },
    rarity: 'epic',
    tier: 'elite',
    order: 12
  },

  // ============================================
  // ADMIN BADGES (10)
  // ============================================
  {
    name: 'admin',
    displayName: 'Admin',
    description: 'Platform moderator with special powers',
    iconName: 'AdminBadge',
    color: '#8B5CF6',
    animationType: 'glow',
    type: 'role',
    category: 'admin',
    requiredRoles: ['admin'],
    rarity: 'epic',
    tier: 'entry',
    order: 1
  },
  {
    name: 'active_moderator',
    displayName: 'Active Moderator',
    description: 'Performed 50 moderation actions',
    iconName: 'ActiveModeratorBadge',
    color: '#06B6D4',
    animationType: 'pulse',
    type: 'achievement',
    category: 'admin',
    rarity: 'rare',
    tier: 'progress',
    order: 3
  },
  {
    name: 'veteran_admin',
    displayName: 'Veteran Admin',
    description: 'Performed 250 moderation actions',
    iconName: 'VeteranAdminBadge',
    color: '#A855F7',
    animationType: 'glow',
    type: 'achievement',
    category: 'admin',
    rarity: 'epic',
    tier: 'mastery',
    order: 6
  },
  {
    name: 'platform_guardian',
    displayName: 'Platform Guardian',
    description: 'Performed 500 moderation actions',
    iconName: 'PlatformGuardianBadge',
    color: '#F97316',
    animationType: 'shimmer',
    type: 'achievement',
    category: 'admin',
    rarity: 'epic',
    tier: 'mastery',
    order: 7
  },

  // ============================================
  // SUPER ADMIN BADGES (8)
  // ============================================
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Ultimate platform control and authority',
    iconName: 'SuperAdminBadge',
    color: '#F59E0B',
    gradientStart: '#FBBF24',
    gradientEnd: '#F59E0B',
    animationType: 'divine',
    type: 'role',
    category: 'admin',
    requiredRoles: ['super_admin'],
    rarity: 'legendary',
    tier: 'entry',
    order: 1
  },
  {
    name: 'platform_architect',
    displayName: 'Platform Architect',
    description: 'Made 100 system-level changes',
    iconName: 'PlatformArchitectBadge',
    color: '#3B82F6',
    animationType: 'rotate',
    type: 'achievement',
    category: 'admin',
    rarity: 'epic',
    tier: 'progress',
    order: 2
  },
  {
    name: 'platform_overlord',
    displayName: 'Platform Overlord',
    description: 'Made 500 system-level changes',
    iconName: 'PlatformOverlordBadge',
    color: '#A855F7',
    animationType: 'glow',
    type: 'achievement',
    category: 'admin',
    rarity: 'legendary',
    tier: 'mastery',
    order: 5
  },
  {
    name: 'god_mode',
    displayName: 'God Mode',
    description: 'Made 1000+ system-level changes',
    iconName: 'GodModeBadge',
    color: '#F59E0B',
    animationType: 'divine',
    type: 'achievement',
    category: 'admin',
    rarity: 'legendary',
    tier: 'elite',
    order: 7
  }
]

async function seedBadges() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobless')
    console.log('✅ Connected to MongoDB')

    // Clear existing badges
    await Badge.deleteMany({})
    console.log('🗑️  Cleared existing badges')

    // Insert badges
    const result = await Badge.insertMany(badges)
    console.log(`✅ Successfully seeded ${result.length} badges!`)

    // Count by category
    const byCategory = await Badge.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    console.log('\n📊 Badges by category:')
    byCategory.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} badges`)
    })

    // Count by rarity
    const byRarity = await Badge.aggregate([
      { $group: { _id: '$rarity', count: { $sum: 1 } } }
    ])

    console.log('\n🎖️  Badges by rarity:')
    byRarity.forEach(rar => {
      console.log(`   ${rar._id}: ${rar.count} badges`)
    })

    console.log('\n✨ Badge seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding badges:', error)
    process.exit(1)
  }
}

// Run the seeder
seedBadges()
