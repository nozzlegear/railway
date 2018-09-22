import { Result, compute } from "./";

describe("result", () => {
    it("should wrap an error", () => {
        const result = Result.ofError(new Error("Test error"));

        expect(Result.isError(result)).toBe(true);
        expect(Result.isOk(result)).toBe(false);
    });

    it("should wrap a value", () => {
        const result = Result.ofValue(5);

        expect(Result.isError(result)).toBe(false);
        expect(Result.isOk(result)).toBe(true);
        expect(Result.getValue(result)).toBe(5);
    });

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
        const generatePromise = () => new Promise(rej => setTimeout(() => rej(new Error("Test Error")), 1000));
        const result = await Result.ofPromise(generatePromise);

        expect(Result.isError(result)).toBe(true);
        expect(result.isError()).toBe(true);
    });

    it("should map string to number", () => {
        const input = Result.ofValue("5");
        const output = input.map(parseInt);

        expect(Result.isError(output)).toBe(false);
        expect(Result.isOk(output)).toBe(true);
    });

    it("should map an error", () => {
        const input = Result.ofError<string>(new Error("Test error"));
        const output = input.map(parseInt);

        expect(Result.isError(output)).toBe(true);
        expect(Result.isOk(output)).toBe(false);
    });

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

    it("should curry Result.defaultValue", () => {
        const result = Result.ofError<string>(new Error("Test error"));
        const curried = Result.defaultValue<string>("Default value");

        expect(curried(result)).toBe("Default value");
    });
});
