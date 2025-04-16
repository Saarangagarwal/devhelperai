import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { promptTemplate, vectorStore, config, getFunctionCallGraph } from "./extension";
import { ChatOllama } from "@langchain/ollama";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { Document } from "langchain/document";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    this._view?.webview.postMessage({
      type: "getUserDefinedLLMModels",
      value: config.get<Array<string>>("ollama_models"),
    });

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "onChatSubmit": {
          console.log("onChatSubmit", data.value);
          if (!data.value) {
            return;
          }
          this._view?.webview.postMessage({
            type: "agentResponse",
            value: await this.getAgentResponse(data.value),
          });
          break;
        }
      }
    });
  }

  public async getAgentResponse(value: any) {
    console.log("getAgentResponse", value);

    const llm = new ChatOllama({
      model: value[value.length - 1].messages[0].model,
      temperature: config.get<number>("temperature") ?? 0.7,
      maxRetries: config.get<number>("maxRetries") ?? 2,
    });
    
    
    // Define state for application
    const InputStateAnnotation = Annotation.Root({
      question: Annotation<string>,
    });
    
    const StateAnnotation = Annotation.Root({
      question: Annotation<string>,
      context: Annotation<Document[]>,
      answer: Annotation<string>,
    });
    
    let retrieval_score = 0;
    
    // Define application steps
    const retrieve = async (state: typeof InputStateAnnotation.State) => {
      const retrievedDocs = await vectorStore.similaritySearch(state.question);
      const dup = await vectorStore.similaritySearchWithScore(state.question);
      if (dup.length > 0) {
        retrieval_score = dup[0][1];
      }
      return { context: retrievedDocs };
    };
    
    
    const generate = async (state: typeof StateAnnotation.State) => {
      const docsContent = state.context.map(doc => doc.pageContent).join("\n");
      const messages = await promptTemplate.invoke({ 
        question: state.question, 
        context: docsContent 
      });
      const response = await llm.invoke(messages);
      return { answer: response.content };
    };
    
    
    // Compile application and test
    const graph = new StateGraph(StateAnnotation)
    .addNode("retrieve", retrieve)
    .addNode("generate", generate)
    .addEdge("__start__", "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", "__end__")
    .compile();
    
    if (value[value.length - 1].messages[0].code) {
      let res = await llm.invoke(
        [
          ["human", value[value.length - 1].messages[0].content + "\n" + value[value.length - 1].messages[0].code],
        ]);
      return res.content;
    }

    let inputs = { question: value[value.length - 1].messages[0].content};
    console.log("Inputs:", inputs);
    console.log('Selected model is ', value[value.length - 1].messages[0].model);
    
    const pattern = /^Which functions does (.+) call from the file path (.*)$/;
    let match = value[value.length - 1].messages[0].content.match(pattern);
    if (match) {
      const calls = getFunctionCallGraph(match[2], match[1]);
      if (calls[0] === 'There is an error in the provided information. Please check for the existence of the provided file path and the function name in that file.') {
        return calls[0];
      }
      if (calls.length === 0) {
        return "Your function does not call any functions";
      }
      return "Your function calls the following functions " + (calls.length > 0 ? calls.join(', ') : 'None');
    }

    let result = await graph.invoke(inputs);
    
    console.log(result.context.slice(0, 2));
    console.log(result);
    console.log(`\nAnswer: ${result["answer"]}`);
    
    console.log(`\nRetrieval Score: ${retrieval_score}`);

    if (retrieval_score > (config.get<number>("retrieval_score") ?? 0.65)) {
      return result["answer"];
    } else {
      let res = await llm.invoke(
        [
          ["human", value[value.length - 1].messages[0].content],
        ]);
      return res.content;
    }
    // inputs = { question: "What does window.smartlook do?" };

    // result = await graph.invoke(inputs);
    // console.log(result.context.slice(0, 2));
    // console.log(`\nAnswer: ${result["answer"]}`);
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
            -->
            <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
                webview.cspSource
    }; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleResetUri}" rel="stylesheet">
    <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${styleMainUri}" rel="stylesheet">
    <script nonce="${nonce}"> 
      const tsvscode = acquireVsCodeApi();
    </script>
    </head>
    <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}
