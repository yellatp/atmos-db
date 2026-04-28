# AtmosDB Architecture

AtmosDB SDK follows an Arduino-style microcontroller architecture, where the SDK acts as the central "board" connecting to various "shields" (Cloudflare services) through standardized "pins" (APIs).

```mermaid
graph TB
    %% Arduino-style Board Layout
    subgraph "AtmosDB Microcontroller Board"
        direction TB
        Power[⚡ Power: Hono Framework] --> CPU[🧠 CPU: Atmos Core Engine]
        CPU --> Pins[Pins: Unified API Interface]

        %% Pin Headers (like Arduino pins)
        Pins --> DigitalPins[Digital Pins<br/>CRUD Operations]
        Pins --> AnalogPins[Analog Pins<br/>Semantic Search]
        Pins --> PWMPins[PWM Pins<br/>File Storage]
        Pins --> SerialPins[Serial Pins<br/>Authentication]
    end

    %% Shield Connections (like Arduino shields)
    DigitalPins -->|D1_PIN| D1Shield[D1 Database Shield<br/>SQL Operations]
    AnalogPins -->|VEC_PIN| VectorizeShield[Vectorize Shield<br/>Vector Search]
    PWMPins -->|R2_PIN| R2Shield[R2 Storage Shield<br/>File Operations]
    SerialPins -->|AUTH_PIN| AuthShield[Auth Shield<br/>Security & JWT]

    %% Additional Modules (like Arduino modules)
    CPU -->|I2C_BUS| AIShield[Workers AI Shield<br/>Embeddings Engine]
    AIShield -->|VECTOR_OUT| VectorizeShield

    CPU -->|SPI_BUS| MiddlewareShield[Middleware Shield<br/>Rate Limiting & CORS]

    %% External Connections
    D1Shield -->|(SQLite)| Cloudflare[(Cloudflare Edge<br/>Network)]
    VectorizeShield -->|(HNSW)| Cloudflare
    R2Shield -->|(S3-compatible)| Cloudflare
    AIShield -->|(Transformers)| Cloudflare

    %% Power and Ground
    Power -->|+5V| AllShields[All Shields Powered]
    Ground[GND: Error Handling] --> CPU

    %% Styling - Arduino color scheme
    style CPU fill:#ff6b35,stroke:#333,stroke-width:3px
    style Pins fill:#f7c59f,stroke:#333,stroke-width:2px
    style D1Shield fill:#4ecdc4,stroke:#333
    style VectorizeShield fill:#45b7d1,stroke:#333
    style R2Shield fill:#96ceb4,stroke:#333
    style AIShield fill:#ffeaa7,stroke:#333
    style AuthShield fill:#dda0dd,stroke:#333
    style MiddlewareShield fill:#98d8c8,stroke:#333
    style Cloudflare fill:#f7dc6f,stroke:#333,stroke-dasharray: 5 5

    %% Arduino-style labels
    classDef arduinoLabel font-family:monospace,font-size:10px
    class DigitalPins,AnalogPins,PWMPins,SerialPins arduinoLabel
```

## Arduino-Style Component Mapping

### Microcontroller Core (Atmos SDK)
- **Power Source**: Hono web framework provides the HTTP request/response cycle
- **CPU**: Core Atmos class orchestrates all operations
- **Pins**: Unified API methods (`set`, `get`, `search`, `store`, etc.)

### Shield Modules (Cloudflare Services)

| Arduino Pin Type | Cloudflare Service | SDK Component | Purpose |
|------------------|-------------------|---------------|---------|
| **Digital Pins** | D1 Database | `AtmosDB` | CRUD operations, SQL queries |
| **Analog Pins** | Vectorize | `AtmosVector` | Semantic search, vector similarity |
| **PWM Pins** | R2 Storage | `AtmosStorage` | File upload/download, binary data |
| **Serial Pins** | Workers KV/Auth | `AtmosAuth` | Authentication, sessions, JWT |
| **I2C Bus** | Workers AI | `AtmosEmbedder` | Text embeddings, AI processing |
| **SPI Bus** | Middleware | Rate Limiting | Request throttling, CORS |

### Power Distribution
- **+5V Rail**: All services powered by Cloudflare Workers runtime
- **GND**: Centralized error handling and logging system
- **3.3V Regulators**: Optional services (AI, advanced middleware)

## Why Arduino-Style Architecture?

1. **Modular Design**: Like Arduino shields, each service is pluggable
2. **Standardized Interfaces**: Consistent API regardless of underlying service
3. **Easy Prototyping**: Quick setup and testing of different combinations
4. **Scalable**: Add/remove services without changing core logic
5. **Hardware Abstraction**: Developers don't need to know Cloudflare internals

## Data Flow (Like Circuit Traces)

```
HTTP Request → Hono Router → Atmos Core → Service Shield → Cloudflare API → Response
       ↓              ↓             ↓           ↓              ↓           ↓
   Routing      Middleware   Orchestration   Abstraction   Execution   Formatting
```

This architecture ensures AtmosDB remains lightweight, focused, and easy to extend while providing the full power of Cloudflare's edge computing platform.
