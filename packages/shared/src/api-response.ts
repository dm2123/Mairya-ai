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