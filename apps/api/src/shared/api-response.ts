export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface ApiError {
  message: string
  code: string
  details?: unknown
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}