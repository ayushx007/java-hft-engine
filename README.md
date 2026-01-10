# 🚀 High-Frequency Trading Engine

A high-performance **Order Matching Engine** designed to handle real-time stock trading. Built with an **Event-Driven Architecture**, this system decouples order ingestion from processing using **Apache Kafka**, ensuring high throughput and fault tolerance.

## 🏗 System Architecture
The system follows a microservices-style architecture:
1.  **API Layer (Producer):** REST API accepts Buy/Sell orders and pushes them to a Kafka Topic.
2.  **Message Broker (Kafka):** Buffers orders to handle high traffic spikes without crashing the database.
3.  **Matching Engine (Consumer):** Consumes orders, matches Buy/Sell requests in memory, and executes trades.
4.  **Persistence (PostgreSQL):** Asynchronously saves user balances and trade history for durability.

## 🛠 Tech Stack
* **Core:** Java 21 (JDK), Spring Boot 3
* **Messaging:** Apache Kafka (Event Streaming)
* **Database:** PostgreSQL 17 (Relational Persistence)
* **Infrastructure:** Docker & Docker Compose
* **Build Tool:** Maven

## ⚡ Key Features
* **Real-time Order Processing:** Sub-millisecond order ingestion via Kafka.
* **Limit Order Book:** In-memory matching logic (FIFO / Price-Time Priority).
* **Distributed Design:** Decoupled services for scalability.
* **Containerized:** Fully Dockerized infrastructure for one-command setup.

## 🚀 Getting Started

### Prerequisites
* Docker Desktop (Running)
* Java 21

### Installation
1.  **Clone the repo**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/trading-engine.git](https://github.com/YOUR_USERNAME/trading-engine.git)
    cd trading-engine
    ```

2.  **Start Infrastructure (Kafka + Postgres)**
    ```bash
    docker-compose up -d
    ```

3.  **Run the Engine**
    ```bash
    ./mvnw spring-boot:run
    ```

4.  **Place an Order**
    ```bash
    curl -X POST "http://localhost:8080/trade?ticker=GOOGL&quantity=10"
    ```

## 🔮 Future Roadmap
* [ ] WebSocket integration for real-time frontend updates.
* [ ] Redis implementation for Order Book caching.
* [ ] CI/CD Pipeline via GitHub Actions.