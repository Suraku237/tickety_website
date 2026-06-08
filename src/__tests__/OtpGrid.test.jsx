import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import OtpGrid from "../components/OtpGrid";

/** Fill a single OTP box by index. */
function typeDigit(container, index, value) {
  const box = container.querySelector(`#otp-${index}`);
  fireEvent.change(box, { target: { value } });
  return box;
}

describe("OtpGrid", () => {
  it("renders six digit boxes", () => {
    const { container } = render(<OtpGrid onComplete={() => {}} />);
    expect(container.querySelectorAll(".otp-box").length).toBe(6);
  });

  it("accepts a single digit and reflects it in the box value", () => {
    const { container } = render(<OtpGrid onComplete={() => {}} />);
    const box = typeDigit(container, 0, "5");
    expect(box.value).toBe("5");
  });

  it("ignores non-numeric input", () => {
    const { container } = render(<OtpGrid onComplete={() => {}} />);
    const box = typeDigit(container, 0, "a");
    expect(box.value).toBe(""); // rejected, state unchanged
  });

  it("calls onComplete with the full code once all six are entered", () => {
    const onComplete = vi.fn();
    const { container } = render(<OtpGrid onComplete={onComplete} />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(container, i, d));
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("does not call onComplete before the grid is full", () => {
    const onComplete = vi.fn();
    const { container } = render(<OtpGrid onComplete={onComplete} />);
    ["1", "2", "3"].forEach((d, i) => typeDigit(container, i, d));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("backspace on an empty box clears the previous digit", () => {
    const { container } = render(<OtpGrid onComplete={() => {}} />);
    typeDigit(container, 0, "7");
    const second = container.querySelector("#otp-1");
    fireEvent.keyDown(second, { key: "Backspace" });
    expect(container.querySelector("#otp-0").value).toBe("");
  });

  it("disables all boxes when disabled prop is set", () => {
    const { container } = render(<OtpGrid onComplete={() => {}} disabled />);
    container.querySelectorAll(".otp-box").forEach((box) => {
      expect(box).toBeDisabled();
    });
  });
});
