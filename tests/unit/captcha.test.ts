import { describe, it, expect, vi } from "vitest";
import { generateCaptchaCode, generateCaptchaImage } from "@/lib/captcha";

describe("Captcha Utility Unit Tests (TC-AUTH-002)", () => {
  it("should generate a captcha code with default length of 6", () => {
    const code = generateCaptchaCode();
    expect(code).toBeDefined();
    expect(code).toHaveLength(6);
    expect(typeof code).toBe("string");
  });

  it("should generate a captcha code with custom length", () => {
    const code = generateCaptchaCode(8);
    expect(code).toHaveLength(8);
  });

  it("should generate random alphanumeric characters", () => {
    const code1 = generateCaptchaCode(10);
    const code2 = generateCaptchaCode(10);
    expect(code1).not.toBe(code2);
  });

  it("should render captcha canvas image data URL in browser environment", () => {
    const mockCtx = {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockCtx as any,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,mockedImageData",
    );

    const code = "ABC123";
    const dataUrl = generateCaptchaImage(code);
    expect(dataUrl).toBe("data:image/png;base64,mockedImageData");
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });
});
