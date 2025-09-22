# Online Chess

A modern chess application where you can challenge a powerful AI opponent or play against a friend. Built with React, TypeScript, and powered by OpenRouter AI.

## Features

- **Play vs. AI**: Challenge an AI opponent with adjustable difficulty levels (Easy, Medium, Hard).
- **Play vs. Friend**: Start a game and share a unique URL with a friend to play turn-by-turn.
- **Modern Interface**: A clean, responsive UI that works on any device.
- **Intuitive Controls**: Move pieces with either click-to-move or drag-and-drop.
- **Full Chess Logic**: Includes all standard rules like pawn promotion, castling, and en passant, powered by `chess.js`.
- **Game History**: Keep track of all moves made during the game.

## Tech Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Chess Logic**: `chess.js`
- **AI Opponent**: OpenRouter API (supports multiple AI models)
- **Deployment**: Docker, Docker Compose, Nginx Proxy Manager integration

## Getting Started with Docker

Follow these instructions to get a local copy up and running using Docker.

### Prerequisites

You must have [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/RaouR/Chess-game-AI-studio.git
    cd Chess-game-AI-studio
    ```

2.  **Create an Environment File**
    If you don't have an existing `.env` file, copy the example file to a new file named `.env`.
    ```sh
    cp .env.example .env
    ```

3.  **Add Your API Key**
    Open the newly created `.env` file in your text editor. You need to add your **OpenRouter API Key**. You can get one from the [OpenRouter website](https://openrouter.ai/keys).

    ```env
    # .env
    OPENROUTE_API_KEY=your_openrouter_api_key_here
    ```

4.  **Create the External Network (if not exists)**
    Ensure you have the `proxy_net` network created for Nginx Proxy Manager integration:
    ```sh
    docker network create proxy_net
    ```

5.  **Build and Run the Application**
    Use Docker Compose to build the image and start the container. The `--build` flag ensures it rebuilds the image if there are any code changes.
    ```sh
    docker compose up -d --build
    ```
    This command will start the chess app container connected to the proxy_net network.

6.  **Configure Nginx Proxy Manager**
    - Open your Nginx Proxy Manager web interface
    - Add a new proxy host pointing to the `chess-app` container
    - Configure your domain and SSL certificates as needed

The application will be accessible through your configured domain via Nginx Proxy Manager.
