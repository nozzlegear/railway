import { Result } from ".";

type Curried<T, U> = (a: AsyncResult<T>) => U;

export class AsyncResult<T> {
    constructor(private value: Promise<Result<T>>) {}

    /**
     * Gets the underlying promise, which can then be awaited to return a @see Result
     */
    get(): Promise<Result<T>> {
        return this.value;
    }

    /**
     * Maps the OK value to another value. Will only run if the value is OK.
     */
    map<U>(fn: (arg: T) => U): AsyncResult<U> {
        return AsyncResult.wrap(this.value.then(Result.map(fn)));
    }

    /**
     * Maps the Error value back to an OK value. Will only run if the value is Error.
     */
    mapError(fn: (arg: unknown) => T): AsyncResult<T> {
        return AsyncResult.wrap(this.get().then(Result.mapError(fn)));
    }

    /**
     * Binds the OK value to the AsyncResult returned by the @param fn function. Will only run if the value is OK.
     */
    bind<U>(fn: (arg: T) => AsyncResult<U>): AsyncResult<U> {
        return AsyncResult.wrap<U>(
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

    /**
     * Binds the Error value to the AsyncReuslt returned by the @param fn function. Will only run if the value is Error.
     */
    bindError(fn: (arg: unknown) => AsyncResult<T>): AsyncResult<T> {
        return AsyncResult.wrap(
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

    /**
     * Passes the OK value to the given @param fn function. Will only run if the value is OK.
     */
    iter(fn: (arg: T) => void): AsyncResult<T> {
        this.get().then(Result.iter(fn));

        return this;
    }

    /**
     * Passes the Error value to the given @param fn function. Will only run if the value is Error.
     */
    iterError(fn: (arg: unknown) => void): AsyncResult<T> {
        this.get().then(Result.iterError(fn));

        return this;
    }

    /**
     * Wraps a value, promise or result in an AsyncResult monad.
     */
    static wrap<T>(value: T | Result<T> | Promise<T | Result<T>>): AsyncResult<T> {
        if (value instanceof Result) {
            return new AsyncResult(Promise.resolve(value));
        }

        if (value instanceof Promise) {
            return new AsyncResult(
                value
                    .then(value => (value instanceof Result ? value : Result.ofValue(value)))
                    .catch(ex => Result.ofError<T>(ex))
            );
        }

        return new AsyncResult(Result.ofPromise(Promise.resolve(value)));
    }

    /**
     * Gets the underlying promise, which can then be awaited.
     */
    static get<T>(a: AsyncResult<T>): ReturnType<typeof a.get> {
        return a.get();
    }

    /**
     * Returns a curried function that will map the OK value to another value. Will only run if the value is OK.
     */
    static map<T, U>(fn: (arg: T) => U): Curried<T, AsyncResult<U>> {
        return a => a.map(fn);
    }

    /**
     * Returns a curried function that will map the Error value back to an OK value. Will only run if the value is Error.
     */
    static mapError<T>(fn: (arg: unknown) => T): Curried<T, AsyncResult<T>> {
        return a => a.mapError(fn);
    }

    /**
     * Returns a curried function that will bind the OK value to the AsyncResult returned by the @param fn function. Will only run if the value is OK.
     */
    static bind<T, U>(fn: (arg: T) => AsyncResult<U>): Curried<T, AsyncResult<U>> {
        return a => a.bind(fn);
    }

    /**
     * Returns a curried function that will bind the Error value to the AsyncReuslt returned by the @param fn function. Will only run if the value is Error.
     */
    static bindError<T>(fn: (arg: unknown) => AsyncResult<T>): Curried<T, AsyncResult<T>> {
        return a => a.bindError(fn);
    }

    /**
     * Returns a curried function that will pass the OK value to the given @param fn function. Will only run if the value is OK.
     */
    static iter<T>(fn: (arg: T) => void): Curried<T, AsyncResult<T>> {
        return a => a.iter(fn);
    }

    /**
     * Returns a curried function that will pass the Error value to the given @param fn function. Will only run if the value is Error.
     */
    static iterError<T>(fn: (arg: unknown) => void): Curried<T, AsyncResult<T>> {
        return a => a.iterError(fn);
    }
}
