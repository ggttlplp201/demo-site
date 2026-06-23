import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./Nav";
import { CartProvider } from "@/state/cart";
import { BomProvider } from "@/state/bom";
import { CompareProvider } from "@/state/compare";
import { ListsProvider } from "@/state/lists";
import { LocaleProvider } from "@/state/locale";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/",
}));

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <CartProvider>
        <BomProvider>
          <CompareProvider>
            <ListsProvider>
              {children}
            </ListsProvider>
          </CompareProvider>
        </BomProvider>
      </CartProvider>
    </LocaleProvider>
  );
}

describe("Nav", () => {
  it("renders without crash", () => {
    render(
      <Providers>
        <Nav />
      </Providers>
    );
  });

  it("renders the DoMusMat logo link", () => {
    render(
      <Providers>
        <Nav />
      </Providers>
    );
    expect(screen.getByText("DoMusMat")).toBeDefined();
  });

  it("renders the cart link with aria-label 报价单", () => {
    render(
      <Providers>
        <Nav />
      </Providers>
    );
    expect(screen.getByLabelText("报价单")).toBeDefined();
  });

  it("renders Login button (general login, ZH default)", () => {
    render(
      <Providers>
        <Nav />
      </Providers>
    );
    // ZH default: "登录"
    expect(screen.getAllByText("登录").length).toBeGreaterThan(0);
  });
});
