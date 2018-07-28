# @nozzlegear/railway

This is a collection of functional helpers and monads, heavily inspired by F#, to help facilitate "railway-oriented" programming in TypeScript.

## Installation

```sh
yarn install @nozzlegear/railway
```

```ts
import { compute, pipe, Result, Async } from "@nozzlegear/railway";
```

## Usage

### `compute`

The `compute` function is an incredibly simple wrapper whose purpose is to group up temporary variables into a "computation block" (think a `let` binding in F#), preventing them from polluting your function scope. It also encourages immutability (but does not require it).

```ts
const order = await compute(async () => {
    const displayId = await database.getDisplayIdAsync();
    const order = {
        ...baseOrder,
        user_id: req.user_id,
        display_id: displayId
    }
    const result = await database.createAsync(order);

    return {
        ...order,
        _id: result.id,
        _rev: result.rev
    }
})
```

In this example, order is only declared once, and the temporary variables that only it uses (displayId, result) are wrapped up neatly in the computation. Here's the same example without wrapping in a computation:

```ts
const displayId = await database.getDisplayIdAsync();
let order = {
    ...baseOrder,
    user_id: req.user_id,
    display_id: displayId
}
const result = await database.createAsync(order);
order = {
    ...order,
    _id: result.id,
    _rev: result.rev
}
```

In this example, order is mutable by default (because its value needs to be reassigned after getting the `result`), and the temporary variables that only it uses are polluting the scope of the rest of the function.

### `pipe`

The `pipe` function is a simple function chain that pipes the result of the last function to the next function. Since custom operators are impossible, the `pipe` function instead uses `.chain` and `.value`.

Note that the functions are executed as they're chained, not when the value is retrieved.

```ts
function getName() {
    return "joshua"
}

function capitalize(str: string) {
    const first = str[0];
    const rest = str.slice(1);

    return first.toUpperCase() + rest.toLowerCase();
}

function formatMessage(name: string) {
    return `Hello, ${name}!`
}

// Pipe the functions together to create the message
const message = pipe(getName())
    .chain(capitalize)
    .chain(formatMessage)
    .value();

console.log(message) // "Hello, Joshua!"
```

### `Result<T>`

The `Result` monad encourages railway-oriented programming by wrapping values in either an "Ok" value or an "Error" value. You can safely operate on the monad without worrying about whether the value is an error or not, as the functions will only operate on "Ok" values.

```ts
const result = Result.ofValue<string>("5")
    .map(str => parseInt(str));

if (result.isOk()) {
    console.log(result.getValue()) // 5
} else {
    console.error(result.getError())
}
```

When the value is an error, none of the functions will run:

```ts
const result = Result.ofError<string>(new Error("Test error"))
    .map(str => parseInt(str));

if (result.isOk()) {
    console.log(result.getValue()) // will not be called
} else {
    console.error(result.getError()) // Error with message "Test error"
}
```

**Always check that a Result has a value before getting the value, and check that a Result has an error before getting the error**. Attemping to do either of these operations without first checking can throw an error and break your program:

```ts
const firstResult = Result.ofError(new Error("Test error"));

firstResult.getValue() // This WILL throw an error

const secondResult = Result.ofValue(5)

secondResult.getError() // This WILL throw an error
```

You can set a default value for the Result, which will be used if the value is an error:

```ts
const value = Result.ofError<string>(new Error("Test error"))
    .map(str => parseInt(str))
    .defaultValue(10)

console.log(value) // 10
```

The `Result` monad's functions can also be curried, which is ideal for working with the `pipe` function:

```ts
function getName() {
    return "joshua"
}

function capitalize(str: string) {
    const first = str[0];
    const rest = str.slice(1);

    return first.toUpperCase() + rest.toLowerCase();
}

function formatMessage(name: string) {
    return `Hello, ${name}!`
}

// Pipe the functions together to create the message, using the Result monad's currying
const message = pipe(getName())
    .chain(Result.ofValue)
    .chain(Result.map(capitalize))
    .chain(Result.map(formatMessage))
    .chain(Result.defaultValue("Hello, Newman..."))
    .value();

console.log(message) // "Hello, Joshua!"
```

You can wrap functions and promises in a Result, which will internally wrap them in a try/catch (or add a `.catch` to the promise chain):

```ts
const fnResult = Result.ofFunction(() => {
    return somethingUndefined / 0
})

console.log(fnResult.isError()) // true

if (fnResult.isError()) {
    console.error(fnResult.getError()) // ReferenceError: somethingUndefined is not defined at ....
}

// Be sure to await the result
const promResult = await Result.ofPromise(async () => {
    return 5
})

console.log(promResult.isOk()) // true

if (promResult.isOk()) {
    console.log(promResult.getValue()) // 5
}
```

### `Async<T>`

The Async monad wraps a promise and adds a couple of functions that make it easier to work with the value of the promise. The biggest change is that `Async.map` takes the value of the promise and returns the exact value you return, where the native `Promise.map` would return an array of the value you return.

```ts
async function getSomethingAsync() {
    return "5";
}

const value = await Async.ofPromise(getSomethingAsync())
    .map(parseInt)
    .get() // Must call .get() to get the final promise so you can await it

console.log(value) // 5

// Doing the same thing with a promise would return an array:
const secondValue = await getSomethingAsync().map(parseInt)

console.log(secondValue) // [5]
```

You can also bind promises, merging the promise returned by the function into the value of the Async's promise:

```ts
async function getSomethingAsync() {
    return "5"
}

async function parseIntAsync(str: string) {
    return parseInt(str);
}

// This is bad, it returns a Promise<int> even after being awaited
const mappedValue: Promise<number> = await Async.ofPromise(getSomethingAsync())
    .map(parseIntAsync)
    .get()

// This is good, it binds the promise returned from `parseIntAsync`
const value: number = await Async.ofPromise(getSomethingAsync())
    .bind(parseIntAsync) 
    .get()

console.log(value) // 5
```

Just like the `Result` monad, `Async` also has curried functions:

```ts
async function getName() {
    return "joshua"
}

function capitalize(str: string) {
    const first = str[0];
    const rest = str.slice(1);

    return first.toUpperCase() + rest.toLowerCase();
}

async function formatMessage(name: string) {
    return `Hello, ${name}!`
}

// Pipe the functions together to create the message, using the Async monad's currying
const message = await pipe(getName())
    .chain(Async.ofPromise)
    .chain(Async.map(capitalize))
    .chain(Async.bind(formatMessage))
    .chain(Async.get)
    .value();

console.log(message) // "Hello, Joshua!"
```