import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("home page", () => {
  it("renders the page heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "LMArena" }),
    ).toBeInTheDocument();
  });

  it("links to the external documentation sites", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /Next\.js Docs/i })).toHaveAttribute(
      "href",
      "https://nextjs.org/docs",
    );
    expect(screen.getByRole("link", { name: /Tailwind Docs/i })).toHaveAttribute(
      "href",
      "https://tailwindcss.com/docs",
    );
  });

  it("renders an ordered list of getting-started steps", () => {
    render(<Home />);

    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
  });
});
