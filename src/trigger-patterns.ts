import * as vscode from 'vscode';
import { EXTENSION_NAME } from './extension';


export class TriggerPatterns {
	public static readonly TRIGGER_CHARS: string[] = [ '{', '[' ];

	private static CUSTOM_PATTERNS: RegExp[] = [];
	private static DEFAULT_PATTERNS: RegExp[] = [
		// https://en.wikibooks.org/wiki/LaTeX/Labels_and_Cross-referencing
		/** basic */
		/\\ref\*?{/i,
		/** formulae */
		/\\eqref\*?{/i,
		/** varioref */
		/\\vref\*?{/i,
		/** hyperref */
		/\\(auto|name)ref\*?{/i,
		/\\hyperref\*?\[/i,	// special trigger char
		/** cleverref */
		/\\(label)?cref\*?{/i,
		/\\cpageref(range)?\*?{/i,
		/\\crefrange\*?{/i,
	];

	public static registerConfigurationWatcher(): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		disposables.push(vscode.workspace.onDidChangeConfiguration(_ => TriggerPatterns.updateCustomPatternsFromConfig()));

		return disposables;
	}

	public static getCustomPatterns(): RegExp[] {
		return this.CUSTOM_PATTERNS;
	}

	public static getDefaultPatterns(): RegExp[] {
		return this.DEFAULT_PATTERNS;
	}

	public static updateCustomPatternsFromConfig(): void {
		this.CUSTOM_PATTERNS = this.readCustomPatternsFromConfig();
	}

	private static readCustomPatternsFromConfig(): RegExp[] {
		const conf = vscode.workspace.getConfiguration(EXTENSION_NAME);
		const patterns: string[] = conf.get('customPatterns') || [];

		return patterns.map(p => `\\\\${p}{`).map(p => new RegExp(p, 'i'));
	}
}
