# Generative AI Backend Service

## Overview
This is the backend service designed to support generative artificial intelligence operations, built using a robust and modern stack consisting of Node.js, Express.js, and TypeScript. It features a scalable architecture designed to manage API requests, process AI model interactions, handle secure authentication, and provide data persistence.

## Technologies Used

### Core Architecture and Languages
* **Node.js**: The JavaScript runtime environment used to execute server-side code, known for its event-driven, non-blocking I/O model.
* **TypeScript**: A strongly typed programming language that builds on JavaScript, providing static typing to catch errors early during development and improve tooling support.
* **Express.js**: A fast, unopinionated, minimalist web framework for Node.js, utilized here to build a comprehensive set of RESTful APIs.

### AI and Machine Learning SDKs
* **@google/genai**: The official Google Generative AI SDK, integrated to provide capabilities for text generation and interactions with Google's large language models.
* **groq-sdk**: The SDK for Groq, enabling blazingly fast inference for large language models.

### Database and Data Storage
* **MongoDB**: A NoSQL, document-oriented database program used for primary data storage.
* **Mongoose**: An Object Data Modeling (ODM) library for MongoDB and Node.js, providing a straightforward, schema-based solution to model application data.
* **Redis**: An in-memory data structure store, used here likely for high-performance caching and rate limiting.

### Authentication and Security
* **JSON Web Token (JWT)**: An open standard used to securely transmit information between parties as a JSON object, specifically for stateless user authentication and authorization.
* **Bcryptjs**: A library to help hash passwords securely, protecting user credentials stored in the database.
* **Helmet**: A middleware that helps secure Express apps by setting various HTTP headers.
* **Express Rate Limit**: A basic rate-limiting middleware for Express, utilized to prevent brute-force attacks and DDOS overloads.
* **Cors**: Middleware that enables Cross-Origin Resource Sharing, allowing the frontend application to interact securely with the API domains.

### Data Validation and Utilities
* **Zod**: A TypeScript-first schema declaration and validation library, ensuring that runtime data matches predefined types.
* **Zod-to-JSON-Schema**: Converts Zod schemas into JSON schemas, useful for API documentation or strict integrations.
* **Multer**: A Node.js middleware for handling "multipart/form-data", primarily used for uploading files from the client.
* **Puppeteer**: A Node library providing a high-level API to control headless Chrome or Chromium, useful for automated web scraping or rendering static outputs.
* **PDF-Parse**: A utility module to extract texts from PDF files.
* **HTTP Status Codes**: A collection of constants representing HTTP status codes, improving code readability.
* **Morgan**: An HTTP request logger middleware for Node.js, used for debugging and logging API traffic.

### Development Tools
* **Nodemon**: A utility that automatically restarts the node application when file changes in the directory are detected.
* **TS-Node**: TypeScript execution engine and REPL for Node.js.
* **ESLint**: A highly configurable, static code analysis tool to identify problematic patterns and enforce code style.

## Directory Structure
The architecture adheres to a clean, modular structure:
* **src/server.ts**: The main entry point to start the server.
* **src/app.ts**: The Express application configuration and middleware setup.
* **src/config/**: Environment variables configuration and database connection setup.
* **src/middleware/**: Custom Express middleware functions (e.g., authentication, error handling).
* **src/modules/**: Domain-driven modules containing specific logic, models, controllers, and services for various parts of the application.
* **src/router/**: Global routing index.
* **src/types/**: Custom TypeScript type definitions.
* **src/utils/**: Reusable helper functions and utility libraries.

## Getting Started

### Prerequisites
* Node.js installed on your machine.
* MongoDB running either locally or in a cloud instance (e.g., MongoDB Atlas).
* Redis running locally or via a hosted service.

### Installation
1. Clone the repository and navigate to the project root directory.
2. Install dependencies:
   npm install

### Environment Configuration
1. Locate the `.env.example` file in the root directory.
2. Create a new file named `.env` in the root directory.
3. Copy the contents of `.env.example` to `.env` and fill in the required values (Database URIs, AI API Keys, JWT Secrets).

### Scripts
* **Start Development Server**: 
  npm run dev
  (Runs the server using nodemon for automatic restarts on changes)
* **Build for Production**:
  npm run build
  (Compiles TypeScript down to JavaScript in the `dist` folder)
* **Start Production Server**:
  npm run start
  (Runs the compiled Javascript output)
* **Linting**:
  npm run lint
  (Checks the code for stylistic and functional errors)
* **Fix Linting Errors**:
  npm run lint:fix
