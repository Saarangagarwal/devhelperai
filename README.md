# devhelperai README

Developer productivity can be significantly impacted by the tools they use. It is estimated that developers spend up to 30% or more of their time on routine and manual tasks, which leads to decreased productivity, burnout, and dissatisfaction.

Recently, it has become evident that LLMs (Large Language Models) can help address several of the productivity challenges faced by developers in software development tasks. As a result, there is a growing need for AI-based coding assistants to enhance developer productivity. This is akin to having an experienced software developer available at all times.

We present DevHelperAI, a chat-based, context-aware, and flexible VSCode AI assistant extension, packed with productivity-enhancing features.

This documentation is in progress and will be updated soon! Thanks for your patience.

## Features

(1) Codebase Parsing and Storage
(2) Question Answering
(3) Function Dependency discovery
(4) Context-aware code and test generation
(5) Code review assistant
(6) Full control over the LLM

<!-- Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

## Requirements

Please install Ollama by visiting https://ollama.com/download and following the installation instructions for your operating system. Running Ollama locally is required, as the extension relies on it to handle model downloads, deployment, and resource allocation for inference.

<!-- If you have any requirements or dependencies, add a section describing those and how to install and configure them. -->

## Extension Settings

| ID                                | Description                                                                                                                                                     | Default                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `devhelperai.ollama_max_retries`  | Set Ollama API max retries value.                                                                                                                               | `2`                                                                              |
| `devhelperai.ollama_models`       | Set the model IDs in an array as they appear on Ollama.                                                                                                         | `["gemma3", "llama3-chatqa:8b", "qwen2.5:1.5b", "deepseek-coder:1.3b-instruct"]` |
| `devhelperai.ollama_temperature`  | Set Ollama inference temperature value; lower is more deterministic, higher is more random.                                                                     | `0.7`                                                                            |
| `devhelperai.retrieval_threshold` | Set Retrieval Threshold; lower is more permissive, higher is more strict. Sets the threshold to decide between RAG inference workflow and normal LLM inference. | `0.65`                                                                           |

<!-- Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something. -->

## Known Issues

This extension has not been tested on Apple Silicon. Please use with caution. More development in progress.

<!-- Calling out known issues can help limit users opening duplicate issues against your extension. -->

## Release Notes

### 0.0.5

Update README

### 0.0.3

Some bug fixes

### 0.0.1

Initial release of DevHelperAI

---

<!-- ## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/) -->

**Enjoy!**
