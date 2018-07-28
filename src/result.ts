type Curried<T, U> = (a: Result<T>) => U;

export class WrappedResultError extends Error {
    constructor(message: string, public originalError: Error) {
        super(message);
    }
}

function valueIsError<T>(value: T | Error): value is Error {
    return value instanceof Error;
}

function valueIsOk<T>(value: T | Error): value is T {
    return !valueIsError(value);
}

export class Result<T> {
    constructor(private value: T | Error) {}

    /**
     * Gets the underlying value. Note that you should check whether the value is Ok before doing this, or else a @see WrappedResultError may be thrown.
     */
    getValue() {
        if (valueIsError(this.value)) {
            throw new WrappedResultError(
                `Attempted to get the raw value of a Result, but the value was an Error.`,
                this.value
            );
        }

        return this.value;
    }

    /**
     * Gets the underlying error. Note that you should check whether the value is Error before doing this, or else a @see WrappedResultError may be thrown.
     */
    getError() {
        if (!valueIsError(this.value)) {
            const type = typeof this.value;

            throw new Error(
                `Attempted to get the Error of a Result, but the value was not an Error. Value type was ${type}.`
            );
        }

        return this.value;
    }

    /**
     * Checks whether the value is Error.
     */
    isError() {
        return valueIsError(this.value);
    }

    /**
     * Checks whether the value is Ok.
     */
    isOk() {
        return !this.isError();
    }

    /**
     * Maps the Ok value to another value. Will only run if the value is Ok.
     */
    map<U>(mapper: (arg: T) => U): Result<U> {
        if (valueIsOk(this.value)) {
            return Result.ofValue(mapper(this.value));
        }

        return Result.ofError(this.value);
    }

    /**
     * Binds the value to the result returned by the @param mapper function. Will only run if the value is Ok.
     */
    bind<U>(mapper: (arg: T) => Result<U>): Result<U> {
        if (valueIsOk(this.value)) {
            return mapper(this.value);
        }

        return Result.ofError(this.value);
    }

    /**
     * Passes the value to the given @param fn function where it can then be used for work that doesn't return a value. Will only run if the value is Ok.
     */
    iter(fn: (arg: T) => void): void {
        if (valueIsOk(this.value)) {
            fn(this.value);
        }
    }

    /**
     * Returns the @param defaultValue if the Result is Error, else returns the Ok value.
     * @example
     * console.log(Result.ofValue(5).defaultValue(10)) // 5
     * console.log(Result.ofError(new Error("Test error")).defaultValue(10)) // 10
     */
    defaultValue(defaultValue: T): T {
        if (valueIsOk(this.value)) {
            return this.value;
        }

        return defaultValue;
    }

    /**
     * Wraps the @param value in an Ok Result.
     */
    static ofValue<T>(value: T) {
        if (valueIsError(value)) {
            throw new WrappedResultError(
                "Attempted to use Result.ofValue, but the given argument was an Error.",
                value
            );
        }

        return new Result<T>(value);
    }

    /**
     * Wraps the @param error in an Error Result.
     */
    static ofError<T>(error: Error) {
        if (valueIsOk(error)) {
            throw new Error(
                "Attempted to use Result.ofError, but the given argument was not an Error."
            );
        }

        return new Result<T>(error);
    }

    /**
     * Takes the given promise or function that returns a promise and wraps it in a try/catch. Returns Result.ofError if it throws an error.
     */
    static ofPromise<T>(promise: Promise<T> | (() => Promise<T>)): Promise<Result<T>> {
        const computation: Promise<T> = typeof promise === "function" ? promise() : promise;

        return computation
            .catch(e => {
                if (typeof e === "string") {
                    return new Error(e);
                }

                if (e instanceof Error) {
                    return e;
                }

                return new Error(
                    "Result.ofPromise caught a promise rejection that was neither a string nor an error. Value: " +
                        e
                );
            })
            .then(r => (r instanceof Error ? Result.ofError<T>(r) : Result.ofValue(r)));
    }

    /**
     * Takes the given function and executes it, returning Result.ofError if it throws an error.
     */
    static ofFunction<T>(computation: (() => T)): Result<T> {
        try {
            return Result.ofValue(computation());
        } catch (e) {
            return Result.ofError(e);
        }
    }

    /**
     * Gets the underlying value of the Result. Note that you should check whether the value is Ok before doing this, or else a @see WrappedResultError may be thrown.
     */
    static getValue<T>(result: Result<T>) {
        return result.getValue();
    }

    /**
     * Gets the underlying error of the Result. Note that you should check whether the value is Error before doing this, or else a @see WrappedResultError may be thrown.
     */
    static getError<T>(result: Result<T>) {
        return result.getError();
    }

    /**
     * Checks whether the Result is Error.
     */
    static isError<T>(result: Result<T>) {
        return result.isError();
    }

    /**
     * Checks whether the Result is Ok.
     */
    static isOk<T>(result: Result<T>) {
        return result.isOk();
    }

    /**
     * Returns a curried function that will map the Ok value to another value. Will only run if the value is Ok.
     */
    static map<T, U>(mapper: (arg: T) => U): Curried<T, Result<U>> {
        return r => r.map(mapper);
    }

    /**
     * Returns a curried function that will bind the value to the result returned by the @param mapper function. Will only run if the value is Ok.
     */
    static bind<T, U>(mapper: (arg: T) => Result<U>): Curried<T, Result<U>> {
        return r => r.bind(mapper);
    }

    /**
     * Returns a curried function that will pass the value to the given @param fn function where it can then be used for work that doesn't return a value. Will only run if the value is Ok.
     */
    static iter<T>(fn: (arg: T) => void): Curried<T, void> {
        return r => r.iter(fn);
    }

    /**
     * Returns a curried function that will return the @param defaultValue if the Result is Error, else returns the Ok value.
     */
    static defaultValue<T>(defaultValue: T): Curried<T, T> {
        return r => r.defaultValue(defaultValue);
    }
}
