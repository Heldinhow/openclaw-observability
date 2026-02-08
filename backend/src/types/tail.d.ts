declare module 'tail' {
  import { EventEmitter } from 'events';

  interface TailOptions {
    fromBeginning?: boolean;
    follow?: boolean;
    logger?: any;
    usePolling?: boolean;
    fsWatchOptions?: any;
    nLines?: number;
  }

  class Tail extends EventEmitter {
    constructor(filename: string, options?: TailOptions);
    unwatch(): void;
    watch(): void;
  }

  export = Tail;
}
