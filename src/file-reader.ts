import { readFileSync } from 'fs';
import * as vscode from 'vscode';
import { MARKERS_KEY } from './extension';
import { Logger } from './logger';

export const texFileGlob = '**/*.tex';


export class FileReader {
	private static readonly DECLARATION_PATTERN = /\\label{(?<marker>[^}]+)}/gm;

	/**
	 * Read markers from files matching {@link texFileGlob} and save them
	 * to {@link vscode.ExtensionContext.workspaceState}.
	 * @returns an array containing all markers
	 */
	public static updateAndGetMarkers(ctx: vscode.ExtensionContext, options?: { manual?: boolean; }): string[] {
		let markers: string[] = [];

		// iterate over tex-files
		vscode.workspace.findFiles(texFileGlob).then(uris => {
			// delete current markers
			ctx.workspaceState.update(MARKERS_KEY, undefined);

			uris.forEach(uri => {
				const fileName = uri.path.replace(/.*\//, '');
				let markersInFile = 0;

				// read file contents
				const data = readFileSync(uri.fsPath, 'utf-8');
				let match = this.DECLARATION_PATTERN.exec(data);
				do {	// iterate over matches
					if (match?.groups?.marker) {
						markersInFile++;
						const existingMarkers = ctx.workspaceState.get<string[]>(MARKERS_KEY) || [];
						ctx.workspaceState.update(MARKERS_KEY, existingMarkers.concat(match.groups.marker));
					}
				} while ((match = this.DECLARATION_PATTERN.exec(data)) !== null);
				Logger.debug(`found ${markersInFile} markers in ${fileName}`);
			});

			markers = ctx.workspaceState.get<string[]>(MARKERS_KEY) || [];
			Logger.debug(`done reading files!`, `Found ${markers?.length} markers across ${uris.length} filess`);
			if (options?.manual) {
				vscode.window.showInformationMessage(`Finished updating markers! Found ${markers?.length} marker(s) across ${uris.length} files(s)`);
			}
		});
		return markers || [];
	}

	/**
	 * Register a {@link vscode.FileSystemWatcher} to update markers when files
	 * matching {@link texFileGlob} get created/changed/deleted.
	 */
	public static registerFileWatcher(ctx: vscode.ExtensionContext): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		const texWatcher = vscode.workspace.createFileSystemWatcher(texFileGlob, false, false, false);
		disposables.push(texWatcher);
		disposables.push(texWatcher.onDidChange(_ => FileReader.updateAndGetMarkers(ctx)));
		disposables.push(texWatcher.onDidCreate(_ => FileReader.updateAndGetMarkers(ctx)));
		disposables.push(texWatcher.onDidDelete(_ => FileReader.updateAndGetMarkers(ctx)));

		return disposables;
	}
}
