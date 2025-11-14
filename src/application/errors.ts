export abstract class AppError extends Error {
  abstract readonly type: string
}

export class ValidationError extends AppError {
  readonly type = 'VALIDATION_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  readonly type = 'NOT_FOUND_ERROR'

  constructor(resource: string, identifier?: string) {
    super(`${resource}${identifier ? ` with identifier '${identifier}'` : ''} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  readonly type = 'CONFLICT_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class InfraError extends AppError {
  readonly type = 'INFRA_ERROR'

  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'InfraError'
  }
}