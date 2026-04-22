export type Constructor<T = unknown> = new (...args: any[]) => T;

export type Primitive = string | number | boolean | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface IEntity {
  id: string;
}

export interface IAuditable {
  createdAt: Date;
  updatedAt?: Date;
}

export type DomainPrimitive<T> = {
  [K in keyof T]: T[K] extends Primitive ? T[K] : T[K] extends object ? DomainPrimitive<T[K]> : never;
};

export interface DomainEvent {
  type: string;
  timestamp: string;
  aggregateId: string;
  version: number;
}

export type EventPayload<T extends DomainEvent = DomainEvent> = Omit<T, 'type' | 'timestamp' | 'aggregateId' | 'version'>;

export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

export const createLogger = (context: string): ILogger => {
  const prefix = `[${context}]`;
  return {
    info: (message, meta) => console.log(`${prefix} INFO:`, message, meta || ''),
    warn: (message, meta) => console.warn(`${prefix} WARN:`, message, meta || ''),
    error: (message, meta) => console.error(`${prefix} ERROR:`, message, meta || ''),
    debug: (message, meta) => console.debug(`${prefix} DEBUG:`, message, meta || ''),
  };
};