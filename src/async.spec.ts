import { Async, pipe } from "./";

describe("Async", () => {
    describe("basics", () => {
        it(".ofPromise should create an Async monad", async () => {
            const a = Async.ofPromise(Promise.resolve(5));

            expect(a).toBeInstanceOf(Async);
            expect(await a.get()).toBe(5);
        });

        it(".wrap should create an Async monad", async () => {
            const a = Async.wrap(5);

            expect(a).toBeInstanceOf(Async);
            expect(await a.get()).toBe(5);
        });

        it(".get should return the underlying promise", () => {
            const a = Async.wrap(5);

            expect(a.get()).toBeInstanceOf(Promise);
            expect(Async.get(a)).toBeInstanceOf(Promise);
        });
    });

    describe(".map", () => {
        it("should map string to number", async () => {
            const a = Async.wrap("5").map(parseInt);

            expect(await a.get()).toBe(5);
        });

        it("should curry and map string to number", async () => {
            const a = pipe("5")
                .chain(Async.wrap)
                .chain(Async.map(parseInt))
                .value();

            expect(await a.get()).toBe(5);
        });
    });

    describe(".bind", () => {
        it("should bind to an Async.wrap", async () => {
            const a = Async.wrap("5").bind(s => Async.wrap(parseInt(s)));

            expect(await a.get()).toBe(5);
        });

        it("should bind to an Async.ofPromise", async () => {
            const a = Async.wrap("5").bind(s => Async.wrap(Promise.resolve(parseInt(s))));

            expect(await a.get()).toBe(5);
        });

        it("should curry and bind string to number", async () => {
            const a = pipe("5")
                .chain(Async.wrap)
                .chain(Async.bind(s => Async.wrap(parseInt(s))))
                .value();

            expect(await a.get()).toBe(5);
        });
    });

    describe(".iter", () => {
        it("should call the iter function", async () => {
            const fn = jest.fn();
            const a = Async.wrap("5").iter(fn);

            await a;

            expect(fn).toBeCalledWith("5");
        });

        it("should not kill the promise and prevent further mapping and binding", async () => {
            const fn = jest.fn();
            const a = Async.wrap("5");

            await a.iter(fn);

            const b = a.map(parseInt);

            expect(fn).toBeCalledWith("5");
            expect(await b.get()).toBe(5);
        });

        it("should curry and call the iter function", async () => {
            const fn = jest.fn();
            const a = pipe("5")
                .chain(Async.wrap)
                .chain(Async.iter(fn))
                .value();

            await a;

            expect(fn).toBeCalledWith("5");
        });
    });

    it("should chain methods together", async () => {
        const a = Async.wrap("5")
            .map(parseInt)
            .bind(i => Async.wrap(i + 5))
            .map(i => i.toString())
            .bind(s => Async.ofPromise(Promise.resolve(parseInt(s))));

        expect(await a.get()).toBe(10);
    });
});
