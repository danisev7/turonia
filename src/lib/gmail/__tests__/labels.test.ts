import { describe, it, expect } from "vitest";
import { getGmailLabelForStage } from "../labels";

describe("getGmailLabelForStage", () => {
  it("returns correct label for infantil", () => {
    expect(getGmailLabelForStage("infantil")).toBe("Currículums/Infantil");
  });

  it("returns correct label for primaria", () => {
    expect(getGmailLabelForStage("primaria")).toBe("Currículums/Primaria");
  });

  it("returns correct label for secundaria", () => {
    expect(getGmailLabelForStage("secundaria")).toBe("Curriculums/Secundària");
  });

  it("returns correct label for altres", () => {
    expect(getGmailLabelForStage("altres")).toBe("Curriculums");
  });

  it("returns default label for unknown stage", () => {
    expect(getGmailLabelForStage("unknown")).toBe("Curriculums");
  });

  it("returns default label for empty string", () => {
    expect(getGmailLabelForStage("")).toBe("Curriculums");
  });
});
