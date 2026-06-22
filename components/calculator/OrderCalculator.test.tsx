import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "@/state/cart";
import { OrderCalculator } from "./OrderCalculator";

describe("OrderCalculator", () => {
  it("shows placeholder strings and enabled CTA when prices are not yet set", () => {
    render(
      <CartProvider>
        <OrderCalculator variantRef="DMJR-TP200W003" />
      </CartProvider>
    );

    expect(screen.getAllByText("Price on request").length).toBeGreaterThan(0);
    expect(screen.getByText("Contact for lead time")).toBeInTheDocument();

    const addToQuoteBtn = screen.getByRole("button", { name: "Adicionar ao orçamento" });
    expect(addToQuoteBtn).toBeEnabled();
  });
});
