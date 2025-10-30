
import { EventEmitter } from 'events';

import { FirestorePermissionError } from './errors';

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We can't type EventEmitter with generics in this version of node
class TypedEventEmitter extends EventEmitter {
  emit<E extends keyof ErrorEvents>(
    event: E,
    ...args: Parameters<ErrorEvents[E]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export const errorEmitter = new TypedEventEmitter();
