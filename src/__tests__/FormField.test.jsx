import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FormField from "../components/FormField";

describe("FormField", () => {
  it("renders the label and current value", () => {
    render(
      <FormField label="Email" value="a@x.com" onChange={() => {}} icon="@" />
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByDisplayValue("a@x.com")).toBeInTheDocument();
  });

  it("calls onChange with the raw input value (not the event)", () => {
    const onChange = vi.fn();
    render(<FormField label="Name" value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "alice" } });
    expect(onChange).toHaveBeenCalledWith("alice");
  });

  it("renders a password field hidden by default and toggles visibility", () => {
    const { container } = render(
      <FormField label="Password" type="password" value="secret" onChange={() => {}} />
    );
    const input = container.querySelector("input");
    expect(input.getAttribute("type")).toBe("password");

    // Toggle button exposes an accessible label
    const toggle = screen.getByLabelText(/show password/i);
    fireEvent.click(toggle);
    expect(input.getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(input.getAttribute("type")).toBe("password");
  });

  it("does not render a visibility toggle for non-password fields", () => {
    render(<FormField label="Email" type="text" value="" onChange={() => {}} />);
    expect(screen.queryByLabelText(/show password/i)).toBeNull();
  });
});
