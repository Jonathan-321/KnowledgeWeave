import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add meta tags for SEO
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'NexusLearn - Personal Knowledge Graph Builder for enhanced learning, concept mapping, and spaced repetition.';
document.head.appendChild(meta);

// Set page title
document.title = "NexusLearn - Personal Knowledge Graph Builder";

createRoot(document.getElementById("root")!).render(<App />);
