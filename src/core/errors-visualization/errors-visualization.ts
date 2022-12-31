import * as vscode from "vscode";
import type { Diagnostic, TextEditorDecorationType, DecorationRenderOptions, Range } from "vscode";
import { DiagnosticSeverity } from "vscode"; // these will be used as a value
import { injectable } from "inversify";
import { objectToCSS } from "../../utils/object-to-css-string";

@injectable()
export class ErrorsVisualization {
  private panelDecor: TextEditorDecorationType | undefined;
  private panelActivatedAt: number = -1;
  private currentFocusedErrorIndex: number | null = null;
  // ─── Common Getters & Transformed Getters ───────────────────────────────────────────────────

  private isOnErrorSelection(): boolean {
    return !!this.currentFocusedErrorIndex;
  }

  private getColorBaseOnDiagnosticSeverity(serverity: DiagnosticSeverity): string {
    switch (serverity) {
      case DiagnosticSeverity.Error:
        return "red";
      case DiagnosticSeverity.Hint:
        return "gray";
      case DiagnosticSeverity.Warning:
        return "lightyellow";
      case DiagnosticSeverity.Information:
        return "white";
      default:
        return "blue";
    }
  }

  private getBaseCSS(color = "blue"): string {
    return objectToCSS({
      position: "relative",
      ["font-family"]: "monospace",
      ["font-weight"]: "500",
      ["z-index"]: 1,
      ["pointer-events"]: "none",
      ["text-align"]: "center",
      ["background-color"]: "#2d3542",
      padding: "2px",
      ["white-space"]: "initial",
      ["font-size"]: "inherit",
      ["text-shadow"]: `0px 0px 2px ${color}`,
    });
  }

  private getLightThemeCSS(color = "blue"): string {
    return objectToCSS({
      ["-webkit-text-stroke"]: `2px ${color}`,
    });
  }

  private getDecorationRenderOptions(
    contentText: string,
    textDecorationBaseCSS: string,
    textDecorationLightThemeCSS: string,
    lightTheme = false
  ): DecorationRenderOptions {
    return {
      isWholeLine: false,
      after: {
        margin: "-0.5em 0 0 0.5em",
        contentText,
        color: "#FFFFFF",
        textDecoration: `none; ${textDecorationBaseCSS} ${lightTheme ? textDecorationLightThemeCSS : ""}`,
        border: "double 2px",
      },
    };
  }
  // ─────────────────────────────────────────────────────────────────────

  // ─── Public Funcs ────────────────────────────────────────────────────

  public onTryingToDisplayPreviousErrorFromCurrentLine(): void {
    return this.viewError("prev", this.getAllErrorMessages());
  }
  public onTryingToDisplayNextErrorFromCurrentLine(): void {
    return this.viewError("next", this.getAllErrorMessages());
  }

  /**
   *
   *
   * @param {boolean} [isFromSelection=false]
   * @return {*}  {void}
   * @memberof ErrorsVisualization
   */
  public onCancleDisplay(isFromSelection: boolean = false): void {
    if (isFromSelection && Date.now() - this.panelActivatedAt <= 50) return; // if panel just got opened . . . ignored
    this.panelDecor?.dispose();
    this.currentFocusedErrorIndex = null;
  }

  // ─────────────────────────────────────────────────────────────────────

  /**
   * @Note Unused
   * @returns vscode.Diagnostic[]
   */
  private getErrorMessagesOnCurrentLine(): Diagnostic[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return [];
    const document = editor.document;
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    const line = editor.selection.active.line;

    return diagnostics
      .filter((d) => d.range.start.line === line)
      .sort((a, b) => a.range.start.character - b.range.start.character);
  }

  private getAllErrorMessages(): Diagnostic[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return [];
    const document = editor.document;
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    diagnostics.sort((a, b) => a.range.start.line - b.range.start.line);

    const reArraged: Diagnostic[] = [],
      checkedLines: number[] = [];

    for (const error of diagnostics) {
      const { line } = error.range.start;
      if (checkedLines.includes(line)) continue;
      const preReArraged = [];
      for (const errorNested of diagnostics) {
        if (errorNested.range.start.line !== line) continue;
        preReArraged.push(errorNested);
      }
      reArraged.push(...preReArraged.sort((a, b) => a.range.start.character - b.range.start.character));
      checkedLines.push(line);
    }

    return reArraged;
  }

  /**
   *
   *
   * @private
   * @param {Diagnostic["range"]} range
   * @param {Diagnostic[]} diagnostics
   * @return {*}  {number}
   * @memberof ErrorsVisualization
   */
  private findDiagnosticIndexFromRange(range: Diagnostic["range"], diagnostics: Diagnostic[]): number {
    return diagnostics.findIndex((diagnostic) => diagnostic.range.isEqual(range));
  }

  private viewError(type: "prev" | "next", errorsToView: Diagnostic[]) {
    if (!errorsToView.length) return;
    const editor = vscode.window.activeTextEditor!;
    const position = editor.selection.active;

    let errorToBeFocused = errorsToView.filter(
      type === "prev"
        ? (diagnostic) =>
            diagnostic.range.start.character <
              (position.line === diagnostic.range.start.line ? position.character : Number.MAX_SAFE_INTEGER) &&
            diagnostic.range.start.line <= position.line
        : (diagnostic) =>
            diagnostic.range.end.character >
              (position.line === diagnostic.range.start.line ? position.character : Number.MIN_SAFE_INTEGER) &&
            diagnostic.range.end.line >= position.line
    );

    const lastIndexOfErrorToBeFocused = type === "prev" ? errorToBeFocused.length - 1 : 0;
    let errorInLen = errorToBeFocused[lastIndexOfErrorToBeFocused];

    if (!errorInLen) return;

    let indexToBeFocued =
      this.findDiagnosticIndexFromRange(errorInLen.range, errorsToView) +
      (this.isOnErrorSelection() ? (type === "prev" ? -1 : 0) : 0);

    const stagedError = errorsToView[indexToBeFocued];
    if (!stagedError) return;

    this.currentFocusedErrorIndex = indexToBeFocued;

    editor.revealRange(stagedError.range, vscode.TextEditorRevealType.InCenter);
    editor.selection = new vscode.Selection(stagedError.range.start, stagedError.range.end);

    this.displayErrorPanel(stagedError, stagedError.range);
  }

  private displayErrorPanel(error: Diagnostic, range: Range) {
    this.panelDecor?.dispose(); //dispose the previous opened panel

    const BASE_CSS = this.getBaseCSS(this.getColorBaseOnDiagnosticSeverity(error.severity));
    const LIGHT_THEME_CSS = this.getLightThemeCSS();

    this.panelDecor = vscode.window.createTextEditorDecorationType({
      ...this.getDecorationRenderOptions(
        `${error.message} (${error.source}/${error.code})`,
        BASE_CSS,
        LIGHT_THEME_CSS
      ),
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      light: this.getDecorationRenderOptions(
        `${error.message} (${error.source}/${error.code})`,
        BASE_CSS,
        LIGHT_THEME_CSS,
        true
      ),
    });
    const editor = vscode.window.activeTextEditor!;
    editor.setDecorations(this.panelDecor, [range]);

    this.panelActivatedAt = Date.now();
  }
}
