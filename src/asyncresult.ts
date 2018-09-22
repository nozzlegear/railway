import { Result } from ".";

export class AsyncResult<T> {
    constructor(private value: Promise<Result<T>>) {}

    get(): Promise<Result<T>> {
        return this.value;
    }

    map<U>(fn: (arg: T) => U): AsyncResult<U> {
        return AsyncResult.ofPromise(this.value.then(Result.map(fn)));
    }

    mapError(fn: (arg: unknown) => T): AsyncResult<T> {
        return AsyncResult.ofPromise(this.get().then(Result.mapError(fn)));
    }

    bind<U>(fn: (arg: T) => AsyncResult<U>): AsyncResult<U> {
        return AsyncResult.ofPromise<U>(
            this.get()
                .then(async result => {
                    if (result.isOk()) {
                        const value = fn(result.getValue());

                        return value;
                    }

                    return AsyncResult.wrap<U>(Result.ofError(result.getError()));
                })
                .then(AsyncResult.get)
        );
    }

    bindError(fn: (arg: unknown) => AsyncResult<T>): AsyncResult<T> {
        return AsyncResult.ofPromise(
            this.get()
                .then(async result => {
                    if (result.isError()) {
                        return fn(result.getError());
                    }

                    return AsyncResult.wrap(result.getValue());
                })
                .then(AsyncResult.get)
        );
    }

    iter(fn: (arg: T) => void): AsyncResult<T> {
        this.get().then(Result.iter(fn));

        return this;
    }

    iterError(fn: (arg: unknown) => void): AsyncResult<T> {
        this.get().then(Result.iterError(fn));

        return this;
    }

    /**
     * Creates an AsyncResult monad from the promise.
     */
    static ofPromise<T>(promise: Promise<Result<T>>): AsyncResult<T> {
        return new AsyncResult(promise);
    }

    /**
     * Wraps a non-promise value in an AsyncResult monad.
     */
    static wrap<T>(value: T | Result<T>): AsyncResult<T> {
        if (value instanceof Result) {
            return AsyncResult.ofPromise(Promise.resolve(value));
        }

        return AsyncResult.ofPromise(Result.ofPromise(Promise.resolve(value)));
    }

    /**
     * Gets the underlying promise, which can then be awaited.
     */
    static get<T>(a: AsyncResult<T>): ReturnType<typeof a.get> {
        return a.get();
    }
}
