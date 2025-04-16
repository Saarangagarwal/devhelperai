// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import * as fs from 'fs';
import * as path from 'path';
import { OllamaEmbeddings } from "@langchain/ollama";
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from 'langchain/document';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { pull } from 'langchain/hub';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { ChatOllama } from "@langchain/ollama";
import { VectorStore } from '@langchain/core/vectorstores';
import * as ts from 'typescript';

export let vectorStore: MemoryVectorStore;
export let promptTemplate: ChatPromptTemplate;
export const config = vscode.workspace.getConfiguration('devhelperai');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "devhelperai" is now active!');

	// let kk = getFunctionCallGraph('C:/Users/s55agarw/Desktop/UWaterloo/MMath CS/Winter 2025/CS 848/devhelperai/src/ollamaProcessor.ts', 'd');
	// console.log('Function call graph:', kk);

	// console.log('Extension context:', context.globalState.keys());
	// context.globalState.setKeysForSync(['faiss_index_file.index']);
	// context.globalState.update('faiss_index_file.index', undefined);
	// console.log('Keys set for sync:', context.globalState.keys());
	// console.log('Global state:', context.globalState.get('faiss_index_file.index'));
	// console.log('Before created:', vscode.workspace.fs.readDirectory(context.extensionUri));
	console.log('Creating directory:', context.extensionUri);
	vscode.workspace.fs.createDirectory(context.extensionUri);
	console.log('Directory created:', vscode.workspace.fs.readDirectory(context.extensionUri));


	console.log(__dirname);
	const faissIndexPath = path.join(__dirname, 'faiss_index_file.index');
	const embeddings = new OllamaEmbeddings({
		model: "mxbai-embed-large",
		baseUrl: "http://localhost:11434",
	});
	vectorStore = await getOrCreateMemoryVectorStore(faissIndexPath, embeddings, context);
	console.log('Vector store created:', vectorStore);

	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
		"devhelperai-sidebar",
		sidebarProvider
		)
	);

	const bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	bar_item.text = "$(beaker) DevHelperAI";
	bar_item.tooltip = "DevHelperAI";
	bar_item.command = "devhelperai.testing123";
	bar_item.show();



	context.subscriptions.push(vscode.commands.registerCommand('devhelperai.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from DevHelperAI!');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('devhelperai.testing123', () => {
		console.log('Testing123 command executed');
		const {activeTextEditor} = vscode.window;
		
		if (!activeTextEditor) {
			vscode.window.showInformationMessage('No active editor found');
			return;
		}
		const text = activeTextEditor.document.getText(activeTextEditor.selection);
		console.log('Selected text:', text);
		sidebarProvider._view?.webview.postMessage({
			type: 'new-todo',
			value: text
		});
	}));

	vscode.window.onDidChangeTextEditorSelection((e) => {
		// Check if there's an active editor
		const activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor) {
			// Get the updated selected text
			const text = activeTextEditor.document.getText(activeTextEditor.selection);
			console.log('Updated Selected text:', text);

			// Send the updated selection to the webview
			sidebarProvider._view?.webview.postMessage({
				type: 'getWindowSelectionTextResponse',
				value: text
			});
		}
	});

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

	let rootDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (false){//context.globalState.keys().includes('vector_store') && context.globalState.get('vector_store')) {
		const localVectorStore = String(context.globalState.get('vector_store'));
		const vectors = JSON.parse(localVectorStore);
		const ebdings = vectors.map((vector: { embedding: any; }) => vector.embedding);
		const documents = vectors.map((vector: { content: any; id: any; }) => ({
			pageContent: vector.content,
			metadata: { id: vector.id }
		}));
		const memoryVectorStore: VectorStore = new MemoryVectorStore(embeddings);
		memoryVectorStore.addVectors(ebdings, documents);
	} else if (rootDir) {
		const codebaseDocs = await readCodebaseFiles(rootDir);
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 500,
			chunkOverlap: 100,
		});
		const allSplits = await splitter.splitDocuments(codebaseDocs);
		console.log('Splits:', allSplits.length);
		console.log('Splits:', allSplits[0].metadata);
		await vectorStore.addDocuments(allSplits);
		console.log('Documents added to vector store:', allSplits.length);
		const localVectorStore = JSON.stringify(vectorStore.memoryVectors);
		context.globalState.setKeysForSync(['vector_store']);
		context.globalState.update('vector_store', localVectorStore);
	}

	



	// const vectors = JSON.parse(localVectorStore);
	// console.log('Vectors:', typeof(vectors));
	// console.log('Vectors type:', vectors);

    // vectors.forEach(x => memoryVectorStore.addVectors(vectors.map(x => x.embedding), vectors.map(x => {
    //   return {
    //     pageContent: x.content,
    //     metadata: { id: x.id }
    //   };
    // })));
	


	promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");
	

}

// Function to read all files in a directory
async function readCodebaseFiles(directory: string): Promise<Document[]> {
	// console.log('Processing for directory:', directory);
    const filesDocs: Document[] = [];

    const readDirectory = (dir: string) => {
		// console.log('Reading directory:', dir);
        const items = fs.readdirSync(dir);
        items.forEach(async item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
				if (fullPath.includes('node_modules')) {
					// pass
				} else {
					readDirectory(fullPath); // Recurse into subdirectories
				}
            } else if (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.ejs') || item.endsWith('.py') || item.endsWith('.java') || item.endsWith('.cpp')) { // Only process code files
                const content = fs.readFileSync(fullPath, 'utf-8');
                filesDocs.push(new Document({
					pageContent: content,
					metadata: {
						source: fullPath,
						type: 'code',

				}}));
            } else if (item.endsWith('.pdf')) {
				const loader = new PDFLoader(fullPath);
				const pdfDocs = await loader.load();
				filesDocs.push(...pdfDocs);
			}
        });
		console.log('DONE');
    };

    readDirectory(directory);
	console.log('Files read from codebase:', filesDocs.length);
    return filesDocs;
}

async function getOrCreateMemoryVectorStore(path: string, embeddings: OllamaEmbeddings, context: vscode.ExtensionContext): Promise<MemoryVectorStore> {
    const vectorStore = new MemoryVectorStore(embeddings);
	return vectorStore;
}

export function getFunctionCallGraph(filePath: string, targetFunction: string): string[] {
	try {
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = ts.createSourceFile(
			path.basename(filePath),
			fileContent,
			ts.ScriptTarget.Latest,
			true
		);

		let callList: string[] = [];

		function findTargetFunction(node: ts.Node): ts.Node | undefined {
			if (
				ts.isFunctionDeclaration(node) &&
				node.name?.text === targetFunction
			) {
				return node;
			}

			// Handle arrow functions or function expressions assigned to const
			if (
				ts.isVariableStatement(node)
			) {
				for (const decl of node.declarationList.declarations) {
					if (
						ts.isIdentifier(decl.name) &&
						decl.name.text === targetFunction &&
						decl.initializer &&
						(ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
					) {
						return decl.initializer;
					}
				}
			}

			return ts.forEachChild(node, findTargetFunction);
		}

		function collectCalls(node: ts.Node) {
			if (ts.isCallExpression(node)) {
				const called = node.expression.getText();
				callList.push(called);
			}
			ts.forEachChild(node, collectCalls);
		}

		const targetNode = findTargetFunction(sourceFile);
		if (targetNode) {
			collectCalls(targetNode);
		} else {
			console.warn(`Function '${targetFunction}' not found in ${filePath}`);
		}

		return callList;
	} catch (error) {
		return [ 
			'There is an error in the provided information. Please check for the existence of the provided file path and the function name in that file.',
        ];
		// return [`Error: ${error}`];
	}
    
}

// This method is called when your extension is deactivated
export function deactivate() {}
