import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("does not call onChange below min when clicking decrement at min value", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={5} min={5} onChange={onChange} />);
    const decrementBtn = screen.getByRole("button", { name: "Diminuir quantidade" });
    fireEvent.click(decrementBtn);
    expect(onChange).not.toHaveBeenCalled();
  });
});
