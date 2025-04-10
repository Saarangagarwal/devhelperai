<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from "svelte";

  let messages: Array<{ sender: string; text: string }> = [];
  let userInput = "";
  let userModel = "user"; // Just a placeholder for the user model
  let selectedInput = "";

  let showFileSelector = false;
  let selectedFilesFromSelector: string[] = [];
  let fileSelectorContainer: HTMLElement;

  let column = 0;
  let chatContainer: HTMLDivElement;

  let models: Record<number, string> = {
    1: "gemma3",
    2: "llama3-chatqa:8b",
    3: "qwen2.5:1.5b",
    4: "deepseek-coder:1.3b-instruct",
    // 5: "llama3.2:3b", // This is the default model
  };
  let selectedModel: string = "llama3.2:3b";

  let chatLog: Array<{
    index: number;
    session: number;
    messages: Array<{
      type: string;
      model: string;
      content: string;
      code: string;
    }>;
  }> = [];

  // Auto-resize logic for textarea
  let textarea: HTMLTextAreaElement;
  let minRows = 2;
  let maxRows = 12;
  let minHeight = `${1 + minRows * 1.1}em`;
  let maxHeight = maxRows ? `${1 + maxRows * 1.1}em` : "auto";

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data; // The JSON data that the extension sends
      switch (message.type) {
        case "agentResponse":
          messages = [...messages, { sender: "Agent", text: message.value }];
          chatLog = [
            ...chatLog,
            {
              index: 0,
              session: 0,
              messages: [
                {
                  type: "Agent",
                  model: selectedModel,
                  content: message.value,
                  code: "",
                },
              ],
            },
          ];
          break;
      }
    });
  });

  function resizeTextarea() {
    if (textarea) {
      // Set the height based on the content of the textarea
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;

      // Optional: Add constraints for min/max height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.maxHeight = maxHeight;
      textarea.style.minHeight = minHeight;
    }
  }

  function handleKeyDown(event: any) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent the default action of the Enter key
      sendMessage(); // Call the sendMessage function
    }
  }

  // Function to send a message
  function sendMessage() {
    if (userInput.trim() === "") return;

    // Add user message to chat history
    messages = [...messages, { sender: "User", text: userInput }];
    chatLog = [
      ...chatLog,
      {
        index: 0,
        session: 0,
        messages: [
          {
            type: "User",
            model: selectedModel,
            content: userInput,
            code: "",
          },
        ],
      },
    ];

    console.log("Chat log in svlte:", chatLog);

    tsvscode.postMessage({
      type: "onChatSubmit",
      value: chatLog,
    });

    // Clear the input
    userInput = "";

    // Simulate an agent response after a short delay
    // setTimeout(() => {
    //   messages = [
    //     ...messages,
    //     { sender: "Agent", text: "This is a response!" },
    //   ];
    //   chatLog = [
    //     ...chatLog,
    //     {
    //       index: 0,
    //       session: 0,
    //       messages: [
    //         {
    //           type: "Agent",
    //           model: selectedModel,
    //           content: "this is a result hehe",
    //           code: "",
    //         },
    //       ],
    //     },
    //   ];
    // }, 1000);
  }
</script>

<div class="container">
  <div class="chat-section" bind:this={chatContainer}>
    {#each chatLog as { index, messages }}
      <div class="chat-group">
        {#each messages as { type, content }}
          {#if type === "User"}
            <div style="margin-left: auto;text-align: right;">
              <b>{type}</b>
            </div>
            <div class="chat-bubble {type}">{@html content}</div>
          {:else}
            <div class="agent-header">
              {#if type.toLowerCase().includes("gpt")}
                <img alt="OpenAI" class="agent-img" />
              {:else if type.toLowerCase().includes("deepseek")}
                <img alt="DeepSeek" class="agent-img" />
              {:else if type.toLowerCase().includes("claude")}
                <img alt="Claude" class="agent-img" />
              {/if}
              <b>{type}:</b>
            </div>
            <div class="chat-bubble agent">{content}</div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>

  <!-- Main input box for user -->
  <div class="input-container">
    <textarea
      bind:this={textarea}
      bind:value={userInput}
      placeholder="Ask Agent"
      on:input={resizeTextarea}
      on:keydown={handleKeyDown}
      style="min-height: {minHeight}; max-height: {maxHeight}; overflow-y: auto; resize: none;"
    ></textarea>
  </div>

  <!-- Right Icons -->
  <div class="right-icons">
    <select class="dropdown" bind:value={selectedModel}>
      <option value="llama3.2:3b" selected>llama3.2:3b</option>
      {#each Object.entries(models) as [key, value]}
        <option {value}>{value}</option>
      {/each}
    </select>
    <button class="send-button" on:click={sendMessage}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path
          d="M1 1.91L1.78 1.5L15 7.44899V8.3999L1.78 14.33L1 13.91L2.58311 8L1 1.91ZM3.6118 8.5L2.33037 13.1295L13.5 7.8999L2.33037 2.83859L3.6118 7.43874L9 7.5V8.5H3.6118Z"
        />
      </svg>
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 0;
    margin: 0;
    font-family: Arial, sans-serif;
  }

  .chat-section {
    flex: 1;
    overflow-y: auto;
    width: 100%;
    border-bottom: 1px solid #ccc;
    padding: 1px;
  }

  .chat-bubble {
    padding: 10px;
    margin: 5px 0;
    border-radius: 8px;
    max-width: 100%;
    word-wrap: break-word;
    color: black;
  }

  .User {
    background-color: #fdf5e9;
    width: 100%;
    margin-left: auto;
    text-align: right;
    align-self: flex-end;
  }

  .agent {
    background-color: #e1ffdb;
    width: 100%;
    align-self: flex-start;
  }

  .selected-text {
    border: 1px solid #ccc;
    padding: 1px;
    margin: 1px;
    background-color: #f9f9f9;
  }

  .send-button {
    background-color: #007bff;
    border-radius: 7%;
    width: 100px;
    max-width: 100%;
  }

  .dropdown {
    border: none;
    outline: none;
    font-size: 14px;
    padding: 5px;
  }

  .right-icons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }

  .input-container {
    position: relative;
    width: 100%;
  }

  textarea {
    width: 100%;
    padding: 10px;
    font-family: inherit;
    line-height: 1.2;
    border: 1px solid #eee;
    resize: none;
    box-sizing: border-box;
    min-height: 2.4em; /* The initial height */
    max-height: 12em; /* Max height constraint */
  }
</style>
