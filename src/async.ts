import { Result } from "./result";

type Curried<T, U> = (a: Async<T>) => U;

/**
 * A monad which wraps a promise and provides convenient utility methods for working with that promise.
 */
export class Async<T> {
    constructor(private value: Promise<T>) {}

    /**
     * Gets the underlying promise, which can then be awaited.
     */
    get(): Promise<T> {
        return this.value;
    }

    /**
     * Gets the underlying promise, wrapped in a Result. This is just a shortcut for `Result.ofPromise(Async.get())`
     */
    getResult(): Promise<Result<T>> {
        return Result.ofPromise(this.value);
    }

    /**
     * Maps the value of the promise to another value.
     */
    map<U>(mapper: (arg: T) => U): Async<U> {
        return Async.ofPromise(this.value.then(mapper));
    }

    /**
     * Binds the value of the promise to the promise returned by the @param mapper function.
     */
    bind<U>(mapper: (arg: T) => Async<U>): Async<U> {
        return Async.ofPromise<U>(this.value.then(mapper).then(Async.get));
    }

    /**
     * Passes the value to the given @param fn function where it can then be used for work that doesn't require returning a value.
     */
    iter(fn: (arg: T) => void): Async<T> {
        this.value.then(fn);

        return this;
    }

    /**
     * Creates an Async monad from the promise.
     */
    static ofPromise<T>(promise: Promise<T>) {
        return new Async(promise);
    }

    /**
     * Wraps a non-promise value in an Async monad.
     */
    static wrap<T>(value: T): Async<T> {
        return Async.ofPromise(new Promise<T>(res => res(value)));
    }

    /**
     * Gets the underlying promise, which can then be awaited.
     */
    static get<T>(a: Async<T>): Promise<T> {
        return a.get();
    }

    /**
     * Gets the underlying promise, wrapped in a Result. This is just a shortcut for `Result.ofPromise(Async.get())`
     */
    static getResult<T>(a: Async<T>): Promise<Result<T>> {
        return a.getResult();
    }

    /**
     * Returns a curried function that will map the value of the promise to another value.
     */
    static map<T, U>(mapper: (arg: T) => U): Curried<T, Async<U>> {
        return a => a.map(mapper);
    }

    /**
     * Returns a curried function that will bind the value of the promise to the promise returned by the @param mapper function.
     */
    static bind<T, U>(mapper: (arg: T) => Async<U>): Curried<T, Async<U>> {
        return a => a.bind(mapper);
    }

    /**
     * Returns a curried function that will pass the value to the given @param fn function where it can then be used for work that doesn't require returning a value.
     */
    static iter<T>(fn: (arg: T) => void): Curried<T, Async<T>> {
        return a => a.iter(fn);
    }
}
