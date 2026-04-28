# AtmosDB Architecture

AtmosDB follows a layered architecture design, providing a unified interface to Cloudflare's edge services through a clean, modular SDK structure.

```mermaid
graph TB
    %% Application Layer
    subgraph "Application Layer"
        direction LR
        App[Your Application<br/>Hono Routes]
        SDK[Atmos SDK<br/>Unified API]
    end

    %% SDK Core Layer
    subgraph "Atmos SDK Core"
        direction TB
        Core[AtmosCore<br/>Main Engine]
        Components[SDK Components]

        Components --> DB[AtmosDB<br/>D1 Interface]
        Components --> Vector[AtmosVector<br/>Vectorize Interface]
        Components --> Storage[AtmosStorage<br/>R2 Interface]
        Components --> Auth[AtmosAuth<br/>Authentication]
        Components --> Embedder[AtmosEmbedder<br/>AI Processing]
    end

    %% Service Layer
    subgraph "Cloudflare Edge Services"
        direction LR
        D1[(D1 Database<br/>SQLite)]
        Vec[[Vectorize<br/>HNSW Index]]
        R2{R2 Storage<br/>S3-compatible}
        AI[/Workers AI<br/>Transformers/]
    end

    %% Data Flow
    App -->|HTTP Requests| SDK
    SDK -->|Unified API Calls| Core
    Core -->|SQL Queries| DB
    Core -->|Vector Operations| Vector
    Core -->|File Operations| Storage
    Core -->|Auth Operations| Auth
    Core -->|Embeddings| Embedder

    DB -->|Data| D1
    Vector -->|Vectors| Vec
    Storage -->|Files| R2
    Embedder -->|AI Processing| AI

    %% Auto-embedding flow
    Embedder -.->|Auto-embed| Vector

    %% Styling
    style App fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style SDK fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style Core fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style Components fill:#e8f5e8,stroke:#2e7d32
    style D1 fill:#e3f2fd,stroke:#1976d2
    style Vec fill:#f3e5f5,stroke:#7b1fa2
    style R2 fill:#fff3e0,stroke:#f57c00
    style AI fill:#e8f5e8,stroke:#2e7d32

    classDef serviceLabel font-family:Arial,font-size:11px,text-align:center
    class DB,Vector,Storage,Auth,Embedder serviceLabel
```

## Architecture Layers

### 1. Application Layer
- **Your Application**: Built with Hono web framework
- **HTTP Routes**: RESTful endpoints for your API
- **Atmos SDK**: Unified interface to all Cloudflare services

### 2. SDK Core Layer
- **AtmosCore**: Main orchestration engine
- **Component Modules**: Specialized interfaces for each service
  - `AtmosDB`: D1 database operations
  - `AtmosVector`: Vectorize semantic search
  - `AtmosStorage`: R2 file operations
  - `AtmosAuth`: Authentication and security
  - `AtmosEmbedder`: AI-powered text embeddings

### 3. Cloudflare Services Layer
- **D1**: Serverless SQLite database
- **Vectorize**: High-performance vector search
- **R2**: S3-compatible object storage
- **Workers AI**: Machine learning inference

## Data Flow Patterns

### Standard CRUD Operations
```
HTTP Request → Hono Route → AtmosDB → D1 Database → Response
```

### Semantic Search with Auto-embedding
```
Text Input → AtmosEmbedder → Workers AI → Vectorize Index → Search Results
```

### File Storage Operations
```
File Upload → AtmosStorage → R2 Bucket → File URL/Response
```

### Authentication Flow
```
Login Request → AtmosAuth → JWT Token → Protected Routes
```

## Key Design Principles

### 1. **Unified API**
Single `Atmos` class provides consistent interface regardless of underlying service complexity.

### 2. **Edge-Native**
All operations happen within Cloudflare's edge network, eliminating cross-region latency.

### 3. **Type Safety**
Full TypeScript support with comprehensive type definitions.

### 4. **Modular Components**
Each service has its own specialized module, allowing selective usage.

### 5. **Auto-embedding**
Seamless integration between data storage and semantic search through automatic vector generation.

## Component Relationships

- **AtmosDB ↔ AtmosVector**: Data stored in D1 can be automatically vectorized for semantic search
- **AtmosEmbedder ↔ AtmosVector**: AI-generated embeddings feed directly into vector search
- **AtmosStorage ↔ All Components**: File storage complements all data operations
- **AtmosAuth ↔ All Components**: Security layer protects all operations

This architecture ensures AtmosDB provides a "Supabase for the Edge" experience while maintaining the performance and scalability of Cloudflare's serverless platform.
