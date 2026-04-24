/**
 * Result Pattern Implementation (Akita Style)
 * Encapsulates success and failure without throwing exceptions.
 */
export class Result<T = unknown, E = string> {
  public readonly success: boolean;
  public readonly data: T | null;
  public readonly error: E | null;
  public readonly metadata: unknown | null;

  constructor(success: boolean, data: T | null, error: E | null, metadata: unknown = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.metadata = metadata;
  }

  /**
   * Create a successful result.
   */
  static ok<T, E = string>(data: T, metadata: unknown = null): Result<T, E> {
    return new Result<T, E>(true, data, null, metadata);
  }

  /**
   * Create a failure result.
   */
  static fail<T = unknown, E = string>(error: E | Error): Result<T, E> {
    const errorMessage = (error instanceof Error ? error.message : String(error)) as unknown as E;
    return new Result<T, E>(false, null, errorMessage);
  }

  get isSuccess(): boolean {
    return this.success;
  }

  get isFailure(): boolean {
    return !this.success;
  }
}
