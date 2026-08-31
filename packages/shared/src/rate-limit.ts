export interface RateLimitConfig {
  windowMs: number
  max: number
  standardHeaders: boolean
  legacyHeaders: boolean
}

export interface RequestId {
  requestId: string
}

export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
}