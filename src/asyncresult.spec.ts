import { AsyncResult, Result, pipe } from ".";

describe("AsyncResult", () => {
    describe(".wrap", () => {
        it("should wrap a value", async () => {
            const r = AsyncResult.wrap(5);

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(result).toBeInstanceOf(Result);
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should wrap a Result", async () => {
            const r = AsyncResult.wrap(Result.ofValue(5));

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(result).toBeInstanceOf(Result);
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should wrap a Result error", async () => {
            const r = AsyncResult.wrap(Result.ofError("Test error"));

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(result).toBeInstanceOf(Result);
            expect(result.isError()).toBe(true);
            expect(result.getError()).toBeInstanceOf(Error);
        });

        it("should wrap a Promise value", async () => {
            const r = AsyncResult.wrap(Promise.resolve(5));

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(result).toBeInstanceOf(Result);
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should wrap a Promise result", async () => {
            const r = AsyncResult.wrap(Promise.resolve(Result.ofValue(5)));

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(result).toBeInstanceOf(Result);
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should wrap a promise that throws an error", async () => {
            const fn = async () => {
                throw new Error("Test error");
            };
            const r = AsyncResult.wrap(fn());

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(result).toBeInstanceOf(Result);
            expect(result.isError()).toBe(true);
            expect(result.getError()).toBeInstanceOf(Error);
        });
    });

    describe(".map", () => {
        it("should map an OK value", async () => {
            const fn = jest.fn(parseInt);
            const r = AsyncResult.wrap("5").map(fn);

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(fn).toBeCalledWith("5");
            expect(result).toBeInstanceOf(Result);
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should not map an Error value", async () => {
            const fn = jest.fn(parseInt);
            const r = AsyncResult.wrap(Result.ofError("Test error"));

            expect(r).toBeInstanceOf(AsyncResult);
            expect(r.get()).toBeInstanceOf(Promise);

            const result = await r.get();

            expect(fn).not.toBeCalled();
            expect(result).toBeInstanceOf(Result);
            expect(result.isError()).toBe(true);
            expect(result.getError()).toBeInstanceOf(Error);
        });

        it("should catch an error thrown and convert it to Result.error", async () => {
            const mocked = jest.fn(_ => {
                throw new Error("Test error");
            });
            const result = await AsyncResult.wrap("5")
                .map<number>(mocked)
                .get();

            expect(mocked).toBeCalled();
            expect(result.isError()).toBe(true);
            expect(result.getError().message).toBe("Test error");
        });
    });

    describe(".mapError", () => {
        it("should map an Error back to an OK value", async () => {
            const fn = jest.fn(_ => 5);
            const result = await AsyncResult.wrap(Result.ofError("Test error"))
                .mapError(fn)
                .get();

            expect(fn).toBeCalled();
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should not map an OK value", async () => {
            const fn = jest.fn(_ => 5);
            const result = await AsyncResult.wrap(Result.ofValue(5)).get();

            expect(fn).not.toBeCalled();
            expect(result.isOk()).toBe(true);
        });

        it("should catch an error thrown and convert it to Result.error", async () => {
            const mocked = jest.fn(_ => {
                throw new Error("Test error");
            });
            const result = await AsyncResult.wrap(Result.ofError("Test error 2"))
                .mapError(mocked)
                .get();

            expect(mocked).toBeCalled();
            expect(result.isError()).toBe(true);
            expect(result.getError().message).toBe("Test error");
        });
    });

    describe(".bind", () => {
        it("should bind an AsyncResult", async () => {
            const fn = jest.fn(parseInt);
            const result = await AsyncResult.wrap("5")
                .bind(arg => AsyncResult.wrap(fn(arg)))
                .get();

            expect(fn).toBeCalledWith("5");
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should not bind an error", async () => {
            const fn = jest.fn(parseInt);
            const result = await AsyncResult.wrap(Result.ofError<string>("Test error"))
                .bind(arg => AsyncResult.wrap(fn(arg)))
                .get();

            expect(fn).not.toBeCalled();
            expect(result.isError()).toBe(true);
        });

        it("should morph the result to an Error", async () => {
            const fn = jest.fn(_ => AsyncResult.wrap(Result.ofError("Test error")));
            const result = await AsyncResult.wrap("5")
                .bind(fn)
                .map(parseInt)
                .get();

            expect(fn).toBeCalledWith("5");
            expect(result.isError()).toBe(true);
        });

        it("should catch an error thrown and convert it to Result.error", async () => {
            const mocked = jest.fn(_ => {
                throw new Error("Test error");
            });
            const result = await AsyncResult.wrap("5")
                .bind<number>(mocked)
                .get();

            expect(mocked).toBeCalled();
            expect(result.isError()).toBe(true);
            expect(result.getError().message).toBe("Test error");
        });
    });

    describe(".bindError", () => {
        it("should bind an error back to an AsyncResult", async () => {
            const fn: (arg: unknown) => AsyncResult<string> = jest.fn(_ => AsyncResult.wrap("test"));
            const result = await AsyncResult.wrap(Result.ofError<string>("Test error"))
                .bindError(fn)
                .get();

            expect(fn).toBeCalled();
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe("test");
        });

        it("should not bind an OK value", async () => {
            const fn = jest.fn(_ => AsyncResult.wrap("test"));
            const result = await AsyncResult.wrap(Result.ofValue("5"))
                .bindError(fn)
                .get();

            expect(fn).not.toBeCalled();
            expect(result.isOk()).toBe(true);
        });

        it("should keep the result an error", async () => {
            const fn = jest.fn(_ => AsyncResult.wrap(Result.ofError("Test error 2")));
            const result = await AsyncResult.wrap(Result.ofError<string>("Test error"))
                .bindError(fn)
                .get();

            expect(fn).toBeCalled();
            expect(result.isError()).toBe(true);
        });

        it("should catch an error thrown and convert it to Result.error", async () => {
            const mocked = jest.fn(_ => {
                throw new Error("Test error");
            });
            const result = await AsyncResult.wrap(Result.ofError("Test error 2"))
                .bindError(mocked)
                .get();

            expect(mocked).toBeCalled();
            expect(result.isError()).toBe(true);
            expect(result.getError().message).toBe("Test error");
        });
    });

    describe(".iter", () => {
        it("should iter an OK value", async () => {
            const fn = jest.fn();
            const result = await AsyncResult.wrap(Result.ofValue(5))
                .iter(fn)
                .get();

            expect(fn).toBeCalledWith(5);
            expect(result.isOk()).toBe(true);
        });

        it("should not iter an Error value", async () => {
            const fn = jest.fn();
            const result = await AsyncResult.wrap(Result.ofError("Test error"))
                .iter(fn)
                .get();

            expect(fn).not.toBeCalled();
            expect(result.isError()).toBe(true);
        });

        it("should catch an error thrown but NOT convert the monad to an Error", async () => {
            const mocked = jest.fn(_ => {
                throw new Error("Test error 2");
            });
            const result = await AsyncResult.wrap(5)
                .iter(mocked)
                .get();

            expect(mocked).toBeCalled();
            expect(result.isOk()).toBe(true);
        });
    });

    describe(".iterError", () => {
        it("should iter an Error value", async () => {
            const fn = jest.fn();
            const result = await AsyncResult.wrap(Result.ofError("Test error"))
                .iterError(fn)
                .get();

            expect(fn).toBeCalled();
            expect(result.isError()).toBe(true);
        });

        it("should not iter an OK value", async () => {
            const fn = jest.fn();
            const result = await AsyncResult.wrap(5)
                .iterError(fn)
                .get();

            expect(fn).not.toBeCalled();
            expect(result.isOk()).toBe(true);
        });

        it("should catch an error thrown but NOT bind to the thrown error", async () => {
            const mocked = jest.fn(_ => {
                throw new Error("Test error 2");
            });
            const result = await AsyncResult.wrap(Result.ofError("Test error 1"))
                .iterError(mocked)
                .get();

            expect(mocked).toBeCalled();
            expect(result.isError()).toBe(true);
            expect(result.getError().message).toBe("Test error 1");
        });
    });

    describe("chaining and currying", () => {
        it("should chain and curry an OK value through a pipe", async () => {
            const mapFn: (arg: string) => number = jest.fn((arg: string) => parseInt(arg));
            const bindFn: (arg: number) => AsyncResult<number> = jest.fn((arg: number) => AsyncResult.wrap(arg + 5));
            const iterFn: (arg: number) => void = jest.fn();
            const result = await pipe("5")
                .chain(AsyncResult.wrap)
                .chain(AsyncResult.map(mapFn))
                .chain(AsyncResult.bind(bindFn))
                .chain(AsyncResult.iter(iterFn))
                .chain(AsyncResult.get)
                .value();

            expect(mapFn).toBeCalledWith("5");
            expect(bindFn).toBeCalledWith(5);
            expect(iterFn).toBeCalledWith(10);
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(10);
        });

        it("should chain and curry an Error value through a pipe", async () => {
            const bindFn: (arg: unknown) => AsyncResult<unknown> = jest.fn(_ =>
                AsyncResult.wrap(Result.ofError("Test error 2"))
            );
            const iterFn: (arg: unknown) => void = jest.fn();
            const mapFn: (arg: unknown) => number = jest.fn(_ => 5);
            const result = await pipe(Result.ofError("Test error"))
                .chain(AsyncResult.wrap)
                .chain(AsyncResult.bindError(bindFn))
                .chain(AsyncResult.iterError(iterFn))
                .chain(AsyncResult.mapError(mapFn))
                .chain(AsyncResult.get)
                .value();

            expect(bindFn).toBeCalled();
            expect(iterFn).toBeCalled();
            expect(mapFn).toBeCalled();
            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });
    });
});
