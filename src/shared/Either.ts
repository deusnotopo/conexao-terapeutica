export type Either<L, R> = Left<L> | Right<R>;

export interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

export interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

export const left = <L>(left: L): Either<L, never> => ({ _tag: 'Left', left });

export const right = <R>(right: R): Either<never, R> => ({ _tag: 'Right', right });

export const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';

export const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';

export const fold = <L, R, T>(either: Either<L, R>, onLeft: (left: L) => T, onRight: (right: R) => T): T => {
  if (isLeft(either)) {
    return onLeft(either.left);
  }
  return onRight(either.right);
};

export const mapLeft = <L, R, L2>(either: Either<L, R>, fn: (left: L) => L2): Either<L2, R> => {
  if (isLeft(either)) {
    return left(fn(either.left));
  }
  return right(either.right);
};

export const mapRight = <L, R, R2>(either: Either<L, R>, fn: (right: R) => R2): Either<L, R2> => {
  if (isRight(either)) {
    return right(fn(either.right));
  }
  return left(either.left);
};

export const chain = <L, R, R2>(either: Either<L, R>, fn: (right: R) => Either<L, R2>): Either<L, R2> => {
  if (isRight(either)) {
    return fn(either.right);
  }
  return left(either.left);
};