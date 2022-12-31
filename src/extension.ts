import "reflect-metadata";
import * as vscode from "vscode";
import { ErrorsPeekABoo } from "./core/errors-peekaboo";
import { myContainer } from "./inversify.config";

export function activate(context: vscode.ExtensionContext) {
  const errorsPeekABoo = myContainer.get<ErrorsPeekABoo>(ErrorsPeekABoo);
  errorsPeekABoo.registerCommands(context); // registering the command <prev,next>
  errorsPeekABoo.registerEventToInvokeCancellation(context); // registering the selected event to invoke cancellation on created extras
}

export function deactivate() {}
