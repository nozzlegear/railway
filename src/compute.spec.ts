import { compute } from "./";

describe("compute()", () => {
    it("should compute a basic block without promises", () => {
        const finalValue = compute(() => {
            const firstValue = 1;
            const secondValue = 2;

            return firstValue + secondValue;
        });

        expect(finalValue).toBe(3);
    });

    it("should compute void", () => {
        const finalValue = compute(() => {
            1 + 2;
        });

        expect(finalValue).toBeUndefined();
    });

    it("should compute an async block", async () => {
        function completeAfterTimeout(length: number) {
            return new Promise(res => setTimeout(res, length));
        }

        const finalValue = await compute(async () => {
            await completeAfterTimeout(1000);

            return 5;
        });

        expect(finalValue).toBe(5);
    });
});
