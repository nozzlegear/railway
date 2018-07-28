/**
 * A simple function that wraps logic in a computation "block". This is conceptually similar to, and 100% inspired by, the "let" blocks of F#. It's just a simple way to compute the value of a variable using other temporary variables without polluting your scope with those temporary variables, and while keeping the final value immutable (`const`).
 * Example:
 * ```ts
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
 * In this example, order is only declared once, and the temporary variables that only it uses (displayId, result) are wrapped up neatly in the computation. Here's the same example without wrapping in a computation:
 * ```ts
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
 * In this example, order is mutable by default (because its value needs to be reassigned after getting the `result`), and the temporary variables that only it uses are polluting the scope of the rest of the function.
 */
export function compute<T>(block: () => T) {
    return block();
}

export default compute;
