import { Result, compute } from "./";

describe("result", () => {
    describe(".ofError", () => {
        it("should wrap an Error instance", () => {
            const result = Result.ofError(new Error("Test error"));

            expect(Result.isError(result)).toBe(true);
            expect(Result.isOk(result)).toBe(false);

            const error = result.getError();
            let message: string;

            expect(error).toBeInstanceOf(Error);

            if (error instanceof Error) {
                message = error.message;
            }

            expect(message).toBe("Test error");
        });

        it("should wrap a string", () => {
            const result = Result.ofError("Test error 2");

            expect(Result.isError(result)).toBe(true);

            const error = result.getError();

            expect(typeof error).toBe("string");
            expect(error).toBe("Test error 2");
        });

        it("should wrap an object", () => {
            const input = {
                hello: "world",
                foo: true
            };
            const result = Result.ofError(input);

            expect(Result.isError(result)).toBe(true);

            const error = result.getError() as typeof input;

            expect(typeof error).toBe("object");
            expect(error.hello).toBe("world");
            expect(error.foo).toBe(true);
        });
    });

    describe(".wrap", () => {
        it("should wrap a value", () => {
            const result = Result.ofValue(5);

            expect(Result.isError(result)).toBe(false);
            expect(Result.isOk(result)).toBe(true);
            expect(Result.getValue(result)).toBe(5);
        });
    });

    describe(".getValue", () => {
        it("should get a value", () => {
            const result = Result.ofValue(5);

            expect(Result.getValue(result)).toBe(5);
            expect(result.getValue()).toBe(5);
        });

        it("should throw an error when getting a value that doesn't exist", () => {
            const result = Result.ofError(new Error("Test error"));

            expect(() => Result.getValue(result)).toThrowError();
            expect(result.getValue).toThrowError();
        });
    });

    describe(".getError", () => {
        it("should get an error", () => {
            const result = Result.ofError(new Error("Test error"));

            expect(result.getError()).toBeInstanceOf(Error);
            expect(Result.getError(result)).toBeInstanceOf(Error);
        });

        it("should throw an error when getting an error that doesn't exist", () => {
            const result = Result.ofValue(5);

            expect(result.getError).toThrowError();
            expect(() => Result.getError(result)).toThrowError();
        });
    });

    describe(".ofFunction", () => {
        it("should wrap an ok function", () => {
            const result = Result.ofFunction(() => 5);

            expect(Result.isError(result)).toBe(false);
            expect(Result.isOk(result)).toBe(true);
        });

        it("should wrap an error function", () => {
            const result = Result.ofFunction<number>(() => {
                if (true) {
                    throw new Error("Test error");
                }

                return 5;
            });

            expect(Result.isError(result)).toBe(true);
            expect(Result.isOk(result)).toBe(false);
        });
    });

    describe(".ofPromise", () => {
        it("should wrap an ok promise", async () => {
            const prom = new Promise<number>(res => res(5));
            const result = await Result.ofPromise(prom);

            expect(Result.isError(result)).toBe(false);
            expect(Result.isOk(result)).toBe(true);
        });

        it("should wrap an error promise", async () => {
            const prom = compute(async () => {
                if (true) {
                    throw new Error("Test error");
                }

                return 5;
            });
            const result = await Result.ofPromise(prom);

            expect(Result.isError(result)).toBe(true);
            expect(Result.isOk(result)).toBe(false);
        });

        it("should wrap a rejected error promise", async () => {
            const prom = new Promise<number>((res, rej) => {
                if (true) {
                    return rej("A reason");
                }

                return res(5);
            });
            const result = await Result.ofPromise(prom);

            expect(Result.isError(result)).toBe(true);
            expect(Result.isOk(result)).toBe(false);
        });

        it("Should wrap a function that returns a promise", async () => {
            const generatePromise = () => new Promise(res => setTimeout(res, 1000));
            const result = await Result.ofPromise(generatePromise);

            expect(Result.isError(result)).toBe(false);
            expect(result.isError()).toBe(false);
        });

        it("Should wrap a function that returns an error promise", async () => {
            const generatePromise = () =>
                new Promise((res, rej) => setTimeout(() => rej(new Error("Test Error")), 1000));
            const result = await Result.ofPromise(generatePromise);

            expect(Result.isError(result)).toBe(true);
            expect(result.isError()).toBe(true);
        });
    });

    describe(".map", () => {
        it("should map string to number", () => {
            const input = Result.ofValue("5");
            const output = input.map(parseInt);

            expect(Result.isError(output)).toBe(false);
            expect(Result.isOk(output)).toBe(true);
        });

        it("should not map an error", () => {
            const input = Result.ofError<string>(new Error("Test error"));
            const output = input.map(parseInt);

            expect(Result.isError(output)).toBe(true);
            expect(Result.isOk(output)).toBe(false);
        });
    });

    describe(".mapError", () => {
        it("should map an error back to an OK value", () => {
            const result = Result.ofError<string>(new Error("Test error")).mapError(err => {
                return err instanceof Error ? err.message : "Unknown object " + err;
            });

            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe("Test error");
        });

        it("should not map an error when value is OK", () => {
            const result = Result.ofValue(5).mapError(err => 10);

            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });
    });

    describe(".bind", () => {
        it("should bind an OK result to an OK result", () => {
            const result = Result.ofValue("5")
                .bind(arg => Result.ofValue(parseInt(arg)))
                .getValue();

            expect(result).toBe(5);
        });

        it("should bind an OK result to an Error result", () => {
            const result = Result.ofValue("test").bind(arg => Result.ofError("parseint failed"));

            expect(result.isError()).toBe(true);
            expect(result.getError()).toBe("parseint failed");
        });

        it("should not bind an Error result at all", () => {
            const fn = jest.fn();
            const result = Result.ofError("Test error").bind(fn);

            expect(fn).not.toBeCalled();
            expect(result.isError()).toBe(true);
        });
    });

    describe(".bindError", () => {
        it("should bind an Error result to an OK result", () => {
            const result = Result.ofError("Test error").bindError(_ => Result.ofValue(5));

            expect(result.isOk()).toBe(true);
            expect(result.getValue()).toBe(5);
        });

        it("should bind an Error result to an Error result", () => {
            const result = Result.ofError("Test error").bindError(_ => Result.ofError("Test error 2"));

            expect(result.isError()).toBe(true);
            expect(result.getError()).toBe("Test error 2");
        });

        it("should not bind an OK result at all", () => {
            const fn = jest.fn();
            const result = Result.ofValue(5).bindError(fn);

            expect(fn).not.toBeCalled();
            expect(result.isOk()).toBe(true);
        });
    });

    describe(".defaultValue", () => {
        it("should return original value when ok", () => {
            const input = Result.ofValue("Hello world");
            const output = input.defaultValue("Shwoop");

            expect(output).toBe("Hello world");
        });

        it("should return default value when result is in error state", () => {
            const input = Result.ofError<string>(new Error("Test error"));
            const output = input.defaultValue("Shwoop");

            expect(output).toBe("Shwoop");
        });
    });

    describe("chaining", () => {
        it("should chain functions", () => {
            const output = Result.ofValue(5)
                .map(arg => "output")
                .bind(arg => Result.ofValue(arg))
                .map(arg => 10)
                .defaultValue(20);

            expect(output).toBe(10);
        });

        it("should chain functions for an error result", () => {
            const output = Result.ofError(new Error("Test error"))
                .map(arg => "output")
                .bind(arg => Result.ofValue(arg))
                .map(arg => 10)
                .defaultValue(20);

            expect(output).toBe(20);
        });
    });

    describe(".iter", () => {
        it("should execute the iter function", () => {
            const result = Result.ofValue(5);
            const iterFn1 = jest.fn();

            result.iter(iterFn1);

            expect(iterFn1).toBeCalled();
        });

        it("should not execute the iter function when there's an error", () => {
            const result = Result.ofError(new Error("Test error"));
            const iterFn1 = jest.fn();

            result.iter(iterFn1);

            expect(iterFn1).not.toBeCalled();
        });

        it("should execute the iter function and return itself for further chaining", () => {
            const result = Result.ofValue(5);
            const fn = jest.fn();
            const value = result
                .iter(fn)
                .map(arg => arg + 5)
                .getValue();

            expect(fn).toBeCalledWith(5);
            expect(value).toBe(10);
        });

        it("should execute the iter function and not modify the value despite valiant attempts", () => {
            const result = Result.ofValue(5);
            const fn = jest.fn(arg => {
                arg + 20;

                return 37;
            });
            const value = result
                .iter(fn)
                .map(arg => arg + 5)
                .getValue();

            expect(fn).toBeCalledWith(5);
            expect(value).toBe(10);
        });
    });

    describe(".iterError", () => {
        it("should execute the iterError function when there's an error", () => {
            const fn = jest.fn();
            const result = Result.ofError(new Error("Test error"));

            result.iterError(fn);

            expect(fn).toBeCalled();
        });

        it("should execute the iterError function and return itself for further chaining", () => {
            const fn = jest.fn();
            const result = Result.ofError<number>(new Error("Test error"));
            const value = result.iterError(fn).defaultValue(5);

            expect(fn).toBeCalled();
            expect(value).toBe(5);
        });

        it("should not execute the iterError function when Result is a value", () => {
            const fn = jest.fn();
            const result = Result.ofValue(5);

            result.iterError(fn);

            expect(fn).not.toBeCalled();
            expect(result.getValue()).toBe(5);
        });

        it("should curry", () => {
            const fn = jest.fn();
            const curried = Result.iterError(fn);

            curried(Result.ofError(new Error("Test error")));

            expect(fn).toBeCalled();
        });
    });

    describe("currying", () => {
        it("should curry Result.map", () => {
            const result = Result.ofValue("5");
            const curried = Result.map<string, number>(parseInt);

            expect(Result.isOk(curried(result))).toBe(true);
            expect(Result.getValue(curried(result))).toBe(5);
        });

        it("should curry Result.bind", () => {
            const result = Result.ofValue("5");
            const curried = Result.bind<string, number>(_ => Result.ofValue(5));

            expect(Result.isOk(curried(result))).toBe(true);
            expect(Result.getValue(curried(result))).toBe(5);
        });

        it("should curry Result.iter", () => {
            const result = Result.ofValue("5");
            const fn = jest.fn();
            const curried = Result.iter<string>(fn);

            curried(result);

            expect(fn).toBeCalled();
        });

        it("should curry Result.iter and return a Result for further operations", () => {
            const result = Result.ofValue("5");
            const fn = jest.fn();
            const curried = Result.iter<string>(fn);
            const value = curried(result)
                .map(parseInt)
                .getValue();

            expect(fn).toBeCalled();
            expect(value).toBe(5);
        });
    });
});
