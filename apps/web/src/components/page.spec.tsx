import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyStatePage, PageHeader } from "./page";

describe("shared page components", () => {
  it("renders a domain heading and description", () => {
    const markup = renderToStaticMarkup(<PageHeader eyebrow="Practice" title="Interviews" description="Simulacao textual" />);
    expect(markup).toContain("Interviews");
    expect(markup).toContain("Simulacao textual");
  });

  it("renders a prepared Career Intelligence route", () => {
    const markup = renderToStaticMarkup(<EmptyStatePage title="Jobs" description="Oportunidades" />);
    expect(markup).toContain("Career Intelligence");
    expect(markup).toContain("Area preparada");
  });
});
