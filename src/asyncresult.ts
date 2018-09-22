import { Result } from ".";

export class AsyncResult<T> {
    constructor(private value: Promise<T>) {}

    get(): Promise<Result<T>> {
        return Result.ofPromise(this.value);
    }

    map<U>(fn: (arg: T) => U): AsyncResult<U> {
        return AsyncResult.ofPromise(this.value.then(fn));
    }

    mapError(fn: (arg: unknown) => T): AsyncResult<T> {
        return AsyncResult.ofPromise(
            this.get().then(async result => {
                if (result.isError()) {
                    return fn(result.getError());
                }

                return result.getValue();
            })
        );
    }

    bind<U>(fn: (arg: T) => AsyncResult<U>): AsyncResult<U> {
        return AsyncResult.ofPromise<U>(this.value.then(fn).then(r => r.value));
    }

    bindError(fn: (arg: unknown) => AsyncResult<T>): AsyncResult<T> {
        return AsyncResult.ofPromise(
            this.get()
                .then(async result => {
                    if (result.isError()) {
                        return fn(result);
                    }

                    return AsyncResult.wrap(result.getValue());
                })
                .then(r => r.value)
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
    static ofPromise<T>(promise: Promise<T>): AsyncResult<T> {
        return new AsyncResult(promise);
    }

    /**
     * Wraps a non-promise value in an AsyncResult monad.
     */
    static wrap<T>(value: T): AsyncResult<T> {
        return AsyncResult.ofPromise(Promise.resolve(value));
    }

    /**
     * Gets the underlying promise, which can then be awaited.
     */
    static get<T>(a: AsyncResult<T>): ReturnType<typeof a.get> {
        return a.get();
    }
}
