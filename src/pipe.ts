export interface IPipe<T> {
    readonly value: () => T;
    chain<R>(fn: (x: T) => R): IPipe<R>;
}

/**
 * A simple function chain that pipes the result of the last function to the next function. Since custom operators are impossible, the `pipe` function instead uses `.chain` and `.value`.
 * Note that the functions are executed as they're chained, not when the value is retrieved.
 */
export function pipe<T>(val: T): IPipe<T> {
    return {
        chain: fn => pipe(fn(val)),
        value: () => val
    };
}
