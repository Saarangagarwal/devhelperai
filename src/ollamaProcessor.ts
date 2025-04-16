import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";


const embeddings = new OllamaEmbeddings({
    model: "mxbai-embed-large",
    baseUrl: "http://localhost:11434",
});

const vectorStore = new FaissStore(embeddings, {});

function a() {
    console.log("a");
}

function b() {
    console.log("b");
    a();
}

function c() {
    console.log("c");
    a();
}

function d() {
    console.log("d");
    b();
    c();
}