import * as vscode from 'vscode';
import { Commands } from './commands';
import { FileReader } from './file-reader';
import { Intellisense } from './intellisense';
import { Logger } from './logger';
import { TriggerPatterns } from './trigger-patterns';
import * as packageJSN from '../package.json';

/**
 * The key for accessing markers in
 * {@link vscode.ExtensionContext.workspaceState}.
 */
export const MARKERS_KEY = 'MARKERS';
export const EXTENSION_NAME = packageJSN.name;


function init(ctx: vscode.ExtensionContext): void {
	FileReader.updateAndGetMarkers(ctx);
	TriggerPatterns.updateCustomPatternsFromConfig();
}

export function activate(context: vscode.ExtensionContext) {
	Logger.DEBUG = false;
	Logger.debug(`Activating "${EXTENSION_NAME}"`);
	const disposables: vscode.Disposable[] = [];

	init(context);

	// register listeners
	disposables.push(...FileReader.registerFileWatcher(context));
	disposables.push(...TriggerPatterns.registerConfigurationWatcher());

	// register commands
	disposables.push(...Commands.registerExtensionCommands(context));

	// register providers
	disposables.push(...Intellisense.registerCompletionItemProvider(context));

	context.subscriptions.push(...disposables);
}

export function deactivate() { }
