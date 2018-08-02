type Curried<T, U> = (option: Option<T>) => U;

function _isSome<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}

function _isNone<T>(value: T | undefined | null): value is undefined | null {
    return !_isSome(value);
}

export class Option<T> {
    constructor(private readonly value?: T | null | undefined) {}

    /**
     * Checks whether the value is some.
     */
    isSome = () => _isSome(this.value);

    /**
     * Checks whether the value is none.
     */
    isNone = () => _isNone(this.value);

    /**
     * Gets the underlying value. You *must* check whether the value is some or none before getting, as using this on a value that is none **will** throw an error.
     */
    get(): T {
        if (_isNone(this.value)) {
            throw new Error(
                "Attempted to get an option value that was none. Use Option.isSome to check if an option has a value before using it."
            );
        }

        return this.value;
    }

    /**
     * Maps the value to another value. Will only run if the value is some.
     */
    map<U>(mapper: (arg: T) => U): Option<U> {
        if (_isSome(this.value)) {
            return Option.ofSome<U>(mapper(this.value));
        }

        return Option.ofNone<U>();
    }

    /**
     * Binds the value to another option. Will only run if the value is some.
     */
    bind<U>(mapper: (arg: T) => Option<U>): Option<U> {
        if (_isSome(this.value)) {
            return mapper(this.value);
        }

        return Option.ofNone<U>();
    }

    /**
     * Passes the value to the given @param fn function where it can the be used for operations that don't require a value to be returned.
     */
    iter(fn: (arg: T) => void): void {
        if (_isSome(this.value)) {
            fn(this.value);
        }
    }

    /**
     * Returns the @param defaultValue if the option is none, else returns the option's value.
     */
    defaultValue(defaultValue: T): T {
        if (_isSome(this.value)) {
            return this.value;
        }

        return defaultValue;
    }

    /**
     * Executes the @param fn function if the value is none and returns the result, else returns the option value itself.
     */
    defaultWith(fn: () => T): T {
        if (_isSome(this.value)) {
            return this.value;
        }

        return fn();
    }

    /**
     * Wraps the @param value in an option.
     */
    static ofSome<T>(value: T) {
        if (_isNone(value)) {
            throw new Error("Option.some received a value that was null or undefined.");
        }

        return new Option<T>(value);
    }

    /**
     * Creates an option with no value.
     */
    static ofNone<T = never>() {
        return new Option<T>();
    }

    /**
     * Checks whether the value is some.
     */
    static isSome<T>(option: Option<T>): boolean {
        return option.isSome();
    }

    /**
     * Checks whether the value is none.
     */
    static isNone<T>(option: Option<T>): boolean {
        return option.isNone();
    }

    /**
     * Gets the underlying value. You *must* check whether the value is some or none before getting, as using this on a value that is none **will** throw an error.
     */
    static get<T>(option: Option<T>): T {
        return option.get();
    }

    /**
     * Returns a curried function that will map the value to another value. Will only run if the value is some.
     */
    static map<T, U>(mapper: (arg: T) => U): Curried<T, Option<U>> {
        return option => option.map(mapper);
    }

    /**
     * Returns a curried function that will bind the value to another option. Will only run if the value is some.
     */
    static bind<T, U>(mapper: (arg: T) => Option<U>): Curried<T, Option<U>> {
        return option => option.bind(mapper);
    }

    /**
     * Returns a curried function that will pass the value to the given @param fn function where it can the be used for operations that don't require a value to be returned.
     */
    static iter<T>(fn: (arg: T) => void): Curried<T, void> {
        return option => option.iter(fn);
    }

    /**
     * Returns a curried function that will return the @param defaultValue if the option is none, else returns the option's value.
     */
    static defaultValue<T>(defaultValue: T): Curried<T, T> {
        return option => option.defaultValue(defaultValue);
    }

    /**
     * Returns a curried function that will execute the @param fn function if the value is none and returns the result, else returns the option's value itself.
     */
    static defaultWith<T>(fn: () => T): Curried<T, T> {
        return option => option.defaultWith(fn);
    }
}
