import * as vscode from 'vscode';
import { MARKERS_KEY } from './extension';
import { FileReader } from './file-reader';
import { Logger } from './logger';
import { TriggerPatterns } from './trigger-patterns';


export class Intellisense {
	private static readonly PROVIDER_OPTIONS = {
		selector: { scheme: 'file', language: 'latex' },
		triggerChars: TriggerPatterns.TRIGGER_CHARS,
	};

	/**
	 * Register the {@link vscode.CompletionItemProvider} created by
	 * {@link getLatexProvider}.
	 */
	public static registerCompletionItemProvider(ctx: vscode.ExtensionContext): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		disposables.push(vscode.languages.registerCompletionItemProvider(
			Intellisense.PROVIDER_OPTIONS.selector,
			Intellisense.getLatexProvider(ctx),
			...Intellisense.PROVIDER_OPTIONS.triggerChars
		));

		return disposables;
	}

	/**
	 * Check if a string matches with any pattern from {@link TriggerPatterns}.
	 * @param line the string to match
	 * @returns `true` if line matches any pattern from {@link TriggerPatterns},
	 * otherwise `false`
	 */
	public static matchAnyPattern(line: string): boolean {
		return TriggerPatterns.getDefaultPatterns().some(pattern => line.match(pattern) !== null)
			|| TriggerPatterns.getCustomPatterns().some(pattern => line.match(pattern) !== null);
	}

	/**
	 * Create a {@link vscode.CompletionItemProvider} that provides markers when
	 * one of {@link Intellisense.PROVIDER_OPTIONS.triggerChars} was typed.
	 * Whatever comes before this must match a
	 * {@link TriggerPatterns TriggerPattern}.
	 * @returns the {@link vscode.CompletionItemProvider}
	 */
	public static getLatexProvider(ctx: vscode.ExtensionContext): vscode.CompletionItemProvider<vscode.CompletionItem> {
		return {
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
				// check if an actual latex ref command triggered the completion
				const line = document.lineAt(position).text.slice(0, position.character);

				if (!Intellisense.matchAnyPattern(line)) {
					Logger.debug(`completion triggered but no ref command could be matched`, `for line ${line}`);
					return null;
				}

				const markers = ctx.workspaceState.get<string[]>(MARKERS_KEY) || FileReader.updateAndGetMarkers(ctx);
				Logger.debug(`markers:`, markers);
				return markers.map(marker => new vscode.CompletionItem(marker, vscode.CompletionItemKind.Value));
			}
		};
	}
}
