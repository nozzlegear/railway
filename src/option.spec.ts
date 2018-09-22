import { Option, compute } from "./";

describe("Option", () => {
    it("should wrap a value", () => {
        const option = Option.ofSome(5);

        expect(option.isSome()).toBe(true);
        expect(option.isNone()).toBe(false);
    });

    it("should create an empty option", () => {
        const option = Option.ofNone<number>();

        expect(option.isSome()).toBe(false);
        expect(option.isNone()).toBe(true);
    });

    describe("instance", () => {
        it("should get a value", () => {
            const option = Option.ofSome(5);

            expect(option.get()).toBe(5);
        });

        it("should throw an error when getting a 'none' value", () => {
            const option = Option.ofNone<number>();

            expect(option.get).toThrowError();
        });

        it("should map a value", () => {
            const option = Option.ofSome("5").map(parseInt);

            expect(option.get()).toBe(5);
        });

        it("should not map when Option.isNone", () => {
            const fn = jest.fn(arg => 5);
            const option = Option.ofNone<string>().map<number>(fn);

            expect(option.defaultValue(10)).toBe(10);
            expect(fn).not.toBeCalled();
        });

        it("should bind a value", () => {
            const option = Option.ofSome("5").bind(str => Option.ofSome(parseInt(str)));

            expect(option.get()).toBe(5);
        });

        it("should not bind when Option.isNone", () => {
            const fn = jest.fn(arg => Option.ofSome(5));
            const option = Option.ofNone<string>().bind<number>(fn);

            expect(option.defaultValue(10)).toBe(10);
            expect(fn).not.toBeCalled();
        });

        describe(".iter", () => {
            it("should iter", () => {
                const fn = jest.fn();

                Option.ofSome(5).iter(fn);

                expect(fn).toBeCalled();
            });

            it("should not iter when Option.isNone", () => {
                const fn = jest.fn();

                Option.ofNone<number>().iter(fn);

                expect(fn).not.toBeCalled();
            });

            it("should iter and return the same option for further chaining", () => {
                const fn = jest.fn();
                const value = Option.ofSome(5)
                    .iter(fn)
                    .map(x => x + 1);

                expect(fn).toBeCalled();
                expect(value.get()).toBe(6);
            });

            it("should not modify the value despite valiant attempts", async () => {
                const fn = jest.fn((value: number) => {
                    value = 21;

                    return 32;
                });
                const value = Option.ofSome(5)
                    .iter(fn)
                    .map(x => x + 1);

                expect(fn).toBeCalled();
                expect(value.get()).toBe(6);
            });
        });

        describe(".iterNone", () => {
            it("should execute when option is none", () => {
                const fn = jest.fn();

                Option.ofNone().iterNone(fn);

                expect(fn).toBeCalled();
            });

            it("should not execute when option is some", () => {
                const fn = jest.fn();

                Option.ofSome(5).iterNone(fn);

                expect(fn).not.toBeCalled();
            });
        });

        it("should return original value", () => {
            const option = Option.ofSome(5).defaultValue(10);

            expect(option).toBe(5);
        });

        it("should return default value when Option.isNone", () => {
            const option = Option.ofNone<number>().defaultValue(10);

            expect(option).toBe(10);
        });

        it("should return original value using defaultWith", () => {
            const fn = jest.fn().mockReturnValue(10);
            const option = Option.ofSome<number>(5).defaultWith(fn);

            expect(option).toBe(5);
            expect(fn).not.toBeCalled();
        });

        it("should return default value using defaultWith when Option.isNone", () => {
            const fn = jest.fn().mockReturnValue(10);
            const option = Option.ofNone<number>().defaultWith(fn);

            expect(option).toBe(10);
            expect(fn).toBeCalled();
        });
    });

    describe("curried", () => {
        it("should get a value", () => {
            const option = Option.ofSome(5);

            expect(Option.get(option)).toBe(5);
        });

        it("should throw an error when getting a 'none' value", () => {
            const option = Option.ofNone();

            expect(() => Option.get(option)).toThrowError();
        });

        it("should map a value", () => {
            const option = Option.ofSome("5");
            const curried = Option.map<string, number>(parseInt);

            expect(curried(option).get()).toBe(5);
        });

        it("should not map when Option.isNone", () => {
            const fn = jest.fn(arg => 5);
            const option = Option.ofNone<string>();
            const curried = Option.map<string, number>(fn);

            expect(curried(option).defaultValue(10)).toBe(10);
            expect(fn).not.toBeCalled();
        });

        it("should bind a value", () => {
            const option = Option.ofSome("5");
            const curried = Option.bind<string, number>(str => Option.ofSome(parseInt(str)));

            expect(curried(option).get()).toBe(5);
        });

        it("should not bind when Option.isNone", () => {
            const fn = jest.fn(arg => Option.ofSome(5));
            const option = Option.ofNone<string>();
            const curried = Option.bind<string, number>(fn);

            expect(curried(option).defaultValue(10)).toBe(10);
            expect(fn).not.toBeCalled();
        });

        it("should iter", () => {
            const fn = jest.fn(arg => {});
            const option = Option.ofSome("5");
            const curried = Option.iter<string>(fn);

            curried(option);

            expect(fn).toBeCalled();
        });

        it("should iter and not have to return an option", () => {
            // Bugfix for previous signature `iter<T>(fn: (arg: T) => Option<T>): Curried<T, Option<T>>`
            let called = false;
            const fn = (arg: string) => {
                called = true;
            };
            const curried = Option.iter<string>(fn);

            curried(Option.ofSome("5"));

            expect(called).toBe(true);
        });

        it("should not iter when Option.isNone", () => {
            const fn = jest.fn();
            const option = Option.ofNone<string>();
            const curried = Option.iter<string>(fn);

            curried(option);

            expect(fn).not.toBeCalled();
        });

        it("should iter and return the same option", () => {
            const fn = jest.fn();
            const option = Option.ofSome(5);
            const curried = Option.iter<number>(fn);
            const value = curried(option).map(x => x + 1);

            expect(fn).toBeCalled();
            expect(value.get()).toBe(6);
        });

        it("should return original value", () => {
            const option = Option.ofSome(5);
            const curried = Option.defaultValue(10);

            expect(curried(option)).toBe(5);
        });

        it("should return default value when Option.isNone", () => {
            const option = Option.ofNone<number>();
            const curried = Option.defaultValue(10);

            expect(curried(option)).toBe(10);
        });

        it("should return original value using defaultWith", () => {
            const fn = jest.fn().mockReturnValue(10);
            const option = Option.ofSome(5);
            const curried = Option.defaultWith(fn);

            expect(curried(option)).toBe(5);
            expect(fn).not.toBeCalled();
        });

        it("should return default value using defaultWith when Option.isNone", () => {
            const fn = jest.fn().mockReturnValue(10);
            const option = Option.ofNone<number>();
            const curried = Option.defaultWith(fn);

            expect(curried(option)).toBe(10);
            expect(fn).toBeCalled();
        });
    });
});
