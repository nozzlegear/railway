type Curried<T, U> = (a: Result<T>) => U;

export class WrappedResultError extends Error {
    constructor(message: string, public originalError: unknown) {
        super(message);
    }
}

type UnderlyingValue<T> = { type: "value"; value: T };
type UnderlyingError = { type: "error"; error: unknown };
type Underlying<T> = UnderlyingValue<T> | UnderlyingError;

function valueIsError<T>(value: Underlying<T>): value is UnderlyingError {
    return value.type === "error";
}

function valueIsOk<T>(value: Underlying<T>): value is UnderlyingValue<T> {
    return value.type === "value";
}

export class Result<T> {
    constructor(private value: Underlying<T>) {}

    /**
     * Gets the underlying value. Note that you should check whether the value is Ok before doing this, or else a @see WrappedResultError may be thrown.
     */
    getValue(): T {
        if (valueIsError(this.value)) {
            throw new WrappedResultError(
                `Attempted to get the raw value of a Result, but the value was an Error.`,
                this.value.error
            );
        }

        return this.value.value;
    }

    /**
     * Gets the underlying error. Note that you should check whether the value is Error before doing this, or else a @see WrappedResultError may be thrown.
     */
    getError(): unknown {
        if (!valueIsError(this.value)) {
            const type = typeof this.value.value;

            throw new Error(
                `Attempted to get the Error of a Result, but the value was not an Error. Value type was ${type}.`
            );
        }

        return this.value.error;
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
            return Result.ofValue(mapper(this.value.value));
        }

        return Result.ofError(this.value.error);
    }

    /**
     * Maps the Error value back to an OK value. Will only run if the value is Error.
     */
    mapError(mapper: (arg: unknown) => T): Result<T> {
        if (valueIsError(this.value)) {
            return Result.ofValue(mapper(this.value.error));
        }

        return this;
    }

    /**
     * Binds the value to the result returned by the @param mapper function. Will only run if the value is Ok.
     */
    bind<U>(mapper: (arg: T) => Result<U>): Result<U> {
        if (valueIsOk(this.value)) {
            return mapper(this.value.value);
        }

        return Result.ofError(this.value.error);
    }

    /**
     * Passes the value to the given @param fn function where it can then be used for work that doesn't return a value. Will only run if the value is Ok.
     */
    iter(fn: (arg: T) => void): Result<T> {
        if (valueIsOk(this.value)) {
            fn(this.value.value);
        }

        return this;
    }

    /**
     * Executes the given @param fn function when the result is Error.
     */
    iterError(fn: (arg: unknown) => void): Result<T> {
        if (valueIsError(this.value)) {
            fn(this.value.error);
        }

        return this;
    }

    /**
     * Returns the @param defaultValue if the Result is Error, else returns the Ok value.
     * @example
     * console.log(Result.ofValue(5).defaultValue(10)) // 5
     * console.log(Result.ofError(new Error("Test error")).defaultValue(10)) // 10
     */
    defaultValue(defaultValue: T): T {
        if (valueIsOk(this.value)) {
            return this.value.value;
        }

        return defaultValue;
    }

    /**
     * Wraps the @param value in an Ok Result.
     */
    static ofValue<T>(value: T) {
        return new Result<T>({
            type: "value",
            value: value
        });
    }

    /**
     * Wraps the @param error in an Error Result.
     */
    static ofError<T>(error: unknown) {
        return new Result<T>({
            type: "error",
            error: error
        });
    }

    /**
     * Takes the given promise or function that returns a promise and wraps it in a try/catch. Returns Result.ofError if it throws an error.
     */
    static ofPromise<T>(promise: Promise<T> | (() => Promise<T>)): Promise<Result<T>> {
        const computation: Promise<T> = typeof promise === "function" ? promise() : promise;

        return computation
            .then(x => {
                const value: UnderlyingValue<T> = {
                    type: "value",
                    value: x
                };

                return value;
            })
            .catch(e => {
                const error: UnderlyingError = {
                    type: "error",
                    error: e
                };

                return error;
            })
            .then(r => (valueIsError(r) ? Result.ofError<T>(r.error) : Result.ofValue<T>(r.value)));
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
    static getValue<T>(result: Result<T>): T {
        return result.getValue();
    }

    /**
     * Gets the underlying error of the Result. Note that you should check whether the value is Error before doing this, or else a @see WrappedResultError may be thrown.
     */
    static getError<T>(result: Result<T>): unknown {
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
     * Returns a curried function that will map the Error value back to an OK value. Will only run if the value is Error.
     */
    static mapError<T>(mapper: (arg: unknown) => T): Curried<T, Result<T>> {
        return r => r.mapError(mapper);
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
    static iter<T>(fn: (arg: T) => void): Curried<T, Result<T>> {
        return r => r.iter(fn);
    }

    /**
     * Returns a curried function that will execute the given @param fn function when the result is Error.
     */
    static iterError<T>(fn: (arg: unknown) => void): Curried<T, Result<T>> {
        return r => r.iterError(fn);
    }
}
