import * as vscode from "vscode";
import type { Disposable, ExtensionContext } from "vscode";

import { inject, injectable } from "inversify";
import { ErrorsVisualization } from "./errors-visualization/errors-visualization";

@injectable()
export class ErrorsPeekABoo {
  constructor(@inject(ErrorsVisualization) private errorsVisualization: ErrorsVisualization) {}

  /**
   *
   *
   * @param {ExtensionContext} context
   * @memberof ErrorsPeekABoo
   */
  public registerCommands(context: ExtensionContext): void {
    const disposables: Disposable[] = [
      vscode.commands.registerCommand(
        "errors-peekaboo.prev",
        this.errorsVisualization.onTryingToDisplayPreviousErrorFromCurrentLine.bind(this.errorsVisualization)
      ),
      vscode.commands.registerCommand(
        "errors-peekaboo.next",
        this.errorsVisualization.onTryingToDisplayNextErrorFromCurrentLine.bind(this.errorsVisualization)
      ),
    ];

    context.subscriptions.push(...disposables); // add disposables to subscriptions
  }

  /**
   *
   *
   * @param {ExtensionContext} context
   * @memberof ErrorsPeekABoo
   */
  public registerEventToInvokeCancellation(context: ExtensionContext): void {
    const disposables: Disposable[] = [
      vscode.workspace.onDidChangeTextDocument(this.cancleAllExtras.bind(this, false)),
      vscode.window.onDidChangeTextEditorSelection(this.cancleAllExtras.bind(this, true)),
    ];

    context.subscriptions.push(...disposables); // add disposables to subscriptions
  }

  private cancleAllExtras(isFromSelection: boolean = false): void {
    this.errorsVisualization.onCancleDisplay(isFromSelection);
  }
}
