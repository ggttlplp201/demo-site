import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DownloadMenu } from "./DownloadMenu";
import { repo } from "@/lib/repository";

describe("DownloadMenu", () => {
  const product = repo.getProduct("barra-led-high-bay")!;

  it("renders the Descarregar trigger button", () => {
    render(<DownloadMenu product={product} />);
    expect(screen.getByRole("button", { name: /descarregar/i })).toBeDefined();
  });

  it("menu is closed initially — format groups not in document", () => {
    render(<DownloadMenu product={product} />);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByText(/Compatível com Revit/i)).toBeNull();
  });

  it("clicking the trigger opens the menu and shows Revit & ArchiCAD group", () => {
    render(<DownloadMenu product={product} />);
    const btn = screen.getByRole("button", { name: /descarregar/i });
    fireEvent.click(btn);
    expect(screen.getByRole("menu")).toBeDefined();
    expect(screen.getByText(/Compatível com Revit & ArchiCAD/i)).toBeDefined();
  });

  it("shows 'Disponível a pedido' for IFC/RFA placeholder assets", () => {
    render(<DownloadMenu product={product} />);
    fireEvent.click(screen.getByRole("button", { name: /descarregar/i }));
    const pendingItems = screen.getAllByText("Disponível a pedido");
    expect(pendingItems.length).toBeGreaterThan(0);
  });

  it("shows GLB download link with correct href", () => {
    render(<DownloadMenu product={product} />);
    fireEvent.click(screen.getByRole("button", { name: /descarregar/i }));
    // The GLB asset has a real file — find the anchor by its text (size label)
    const link = screen.getByText("2.4 MB").closest("a");
    expect(link).toBeDefined();
    expect(link!.getAttribute("href")).toBe("/models/high_bay_led_bar.glb");
    expect(link!.hasAttribute("download")).toBe(true);
  });

  it("closes the menu when clicking the trigger again", () => {
    render(<DownloadMenu product={product} />);
    const btn = screen.getByRole("button", { name: /descarregar/i });
    fireEvent.click(btn);
    expect(screen.getByRole("menu")).toBeDefined();
    fireEvent.click(btn);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("trigger has aria-haspopup=menu and aria-expanded", () => {
    render(<DownloadMenu product={product} />);
    const btn = screen.getByRole("button", { name: /descarregar/i });
    expect(btn.getAttribute("aria-haspopup")).toBe("menu");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
});
