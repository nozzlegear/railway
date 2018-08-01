import { Callback, compute } from "./";

describe("Callback", () => {
    it("should start with a value and wrap it in a promise", () => {
        Callback.withValue(5);

        expect(Callback.execute()).toBeInstanceOf(Promise);
    });

    it("should start with a promise", () => {
        Callback.withValue(5);

        expect(Callback.execute()).toBeInstanceOf(Promise);
    });

    it("should return a promise wrapping something that signifies whether there was an error or not", () => {
        // An option is probably best for this, although Option<Error> seems weird, like you *want* to use a Result instead, but Result implies there's a value if it finishes without error.
    });

    it("should look like a pipe", () => {
        Callback.withValue(5)
            .chain(arg => something())
            .chain(arg => something())
            .chain(arg => something())
            .execute();
    });

    it("should pass the start value down the chain", () => {
        Callback.withValue(5)
            .chain(arg => expect(arg).toBe(5))
            .chain(arg => expect(arg).toBe(5))
            .execute();
    });

    it("should pass the start value down the chain until a different chain is bound", () => {
        // TODO: How does this work with short circuiting? Should the chain not return any value but an empty promise?
        // If it short circuits before the bind, the final result wouldn't have the bound value.
        Callback.withValue(5)
            .chain(arg => expect(arg).toBe(5))
            .bind(arg => Callback.ofValue(6))
            .chain(arg => expect(arg).toBe(6))
            .execute();
    });

    it("should not execute any function in the chain until .execute is called", () => {});

    it("should wait for each function to call next before continuing", () => {});

    it("should short circuit once any chain returns a value", () => {});

    it("should short circuit once any chain returns an error", () => {});
});
