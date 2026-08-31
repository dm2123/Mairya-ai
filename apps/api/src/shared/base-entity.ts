export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatedUpdatedFields {
  createdBy?: string
  updatedBy?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  skip?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}