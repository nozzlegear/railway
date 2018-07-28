import { pipe } from "./";

describe("pipe", () => {
    it("should have .chain and .value functions", () => {
        const value = pipe("5");

        expect(value).toMatchObject({
            value: expect.any(Function),
            chain: expect.any(Function)
        });
    });

    it("should return first value if no chains are added", () => {
        const value = pipe("5").value();

        expect(value).toBe("5");
    });

    it("should chain", () => {
        const value = pipe("5")
            .chain(parseInt)
            .chain(i => i + 5)
            .chain(i => i.toString())
            .chain(parseInt)
            .value();

        expect(value).toBe(10);
    });

    it("should allow branching into different chains", () => {
        const originalPipe = pipe("5")
            .chain(parseInt)
            .chain(i => i + 5);
        const firstBranch = originalPipe.chain(i => `The number is ${i}`);
        const secondBranch = originalPipe
            .chain(i => i + 20)
            .chain(i => i.toString())
            .chain(parseInt);

        expect(originalPipe.value()).toBe(10);
        expect(firstBranch.value()).toBe("The number is 10");
        expect(secondBranch.value()).toBe(30);
    });
});
