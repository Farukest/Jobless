import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Hook to fetch public system configurations
 * These configs are dynamically managed by admins and include:
 * - content_categories
 * - content_types
 * - difficulty_levels
 * - production_request_types
 * - platforms
 * - alpha_categories
 * - potential_ratings
 * - risk_ratings
 * - course_categories
 * - engagement_types
 * - required_actions
 * etc.
 */
export const usePublicConfigs = () => {
  return useQuery({
    queryKey: ['public-configs'],
    queryFn: async () => {
      const response = await api.get('/configs/public')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - configs don't change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get a specific config value
 */
export const useConfig = (configKey: string) => {
  const { data: configs, isLoading, error } = usePublicConfigs()

  return {
    data: configs?.[configKey],
    isLoading,
    error,
  }
}

/**
 * Helper to format config values as select options
 */
export const formatAsOptions = (values: string[] | undefined, labelFormatter?: (value: string) => string) => {
  if (!values || !Array.isArray(values)) return []

  return values.map((value) => ({
    value,
    label: labelFormatter ? labelFormatter(value) : formatLabel(value),
  }))
}

/**
 * Default label formatter - converts snake_case to Title Case
 */
const formatLabel = (value: string): string => {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
