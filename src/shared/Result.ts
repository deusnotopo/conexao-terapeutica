export type ResultStatus = 'success' | 'failure';

export interface ISuccess<T> {
  readonly status: 'success';
  readonly data: T;
}

export interface IFailure<E> {
  readonly status: 'failure';
  readonly error: E;
}

export type Result<T, E = Error> = ISuccess<T> | IFailure<E>;

export const ok = <T>(data: T): Result<T, never> => ({ status: 'success', data });

export const fail = <E = Error>(error: E): Result<never, E> => ({ status: 'failure', error });

export const isOk = <T, E>(result: Result<T, E>): result is ISuccess<T> => result.status === 'success';

export const isFailure = <T, E>(result: Result<T, E>): result is IFailure<E> => result.status === 'failure';

export const map = <T, E, U>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> => {
  if (isOk(result)) {
    return ok(fn(result.data));
  }
  return fail(result.error);
};

export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  if (isFailure(result)) {
    return fail(fn(result.error));
  }
  return ok(result.data);
};

export const getOrElse = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (isOk(result)) {
    return result.data;
  }
  return defaultValue;
};

export const getOrThrow = <T, E>(result: Result<T, E>): T => {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
};