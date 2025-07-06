import { ClientConnectionClosedInstruction, ClientConnectionClosedReason } from "#shared/protocol.mjs";

test("client connection closed reasons", () => {
    for (const reasonConfig of Object.values(ClientConnectionClosedReason)) {
        // Avoid using reason codes outside of the private range:
        // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.
        expect(reasonConfig.code).toBeGreaterThanOrEqual(4000);
        expect(reasonConfig.code).toBeLessThanOrEqual(4999);
        // Ensure no more than 123 bytes are used in the reason string.
        expect(new TextEncoder().encode(reasonConfig.reason).length).toBeLessThanOrEqual(123);
        // Make sure every disconnect reason has an instruction string.
        expect(ClientConnectionClosedInstruction.hasOwnProperty(reasonConfig.code)).toBeTruthy();
    }
});
