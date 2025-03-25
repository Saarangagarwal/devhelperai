// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "devhelperai" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('devhelperai.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from DevHelperAI!');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('devhelperai.feedbackQuestion', () => {
		vscode.window.showInformationMessage('How are you liking the DevHelperAI extension?', "It's great!", "It's okay", "Not good").then((response) => {
			if (response === "It's great!") {
				vscode.window.showInformationMessage('That is great to hear!');
			}
			else if (response === "It's okay") {
				vscode.window.showInformationMessage('We will try to improve!');
			}
			else if (response === "Not good") {
				vscode.window.showInformationMessage('We are sorry to hear that!');
			}
		});
	}));

}

// This method is called when your extension is deactivated
export function deactivate() {}
