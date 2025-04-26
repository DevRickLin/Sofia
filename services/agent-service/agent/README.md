# SOFIA Agent Service

## Memory Storage

The SOFIA agent service now uses persistent memory storage to maintain user memories across restarts.

### Memory Storage Configuration

Memory is stored using SQLite by default. The configuration is controlled through environment variables:

- `MEMORY_DB_FILE`: The path to the SQLite database file (default: `tmp/memory.db`)
- `MEMORY_TABLE_NAME`: The name of the table for storing user memories (default: `user_memories`)

### Setup

1. Copy the `.env.example` file to `.env`:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file and set your configuration values:
   ```
   # Memory configuration
   MEMORY_DB_FILE=tmp/memory.db
   MEMORY_TABLE_NAME=user_memories
   ```

3. Make sure the directory for the database file exists:
   ```
   mkdir -p tmp
   ```

### Alternative Storage Backends

Agno supports multiple storage backends. To use a different database:

#### PostgreSQL

```python
from agno.memory.v2.db.postgres import PostgresMemoryDb

memory_db = PostgresMemoryDb(
    table_name="user_memories",
    connection_string="postgresql://user:password@localhost:5432/mydb"
)
```

#### MongoDB

```python
from agno.memory.v2.db.mongo import MongoMemoryDb

memory_db = MongoMemoryDb(
    collection_name="user_memories",
    connection_string="mongodb://localhost:27017/",
    database_name="agno_memory"
)
```

#### Redis

```python
from agno.memory.v2.db.redis import RedisMemoryDb

memory_db = RedisMemoryDb(
    prefix="user_memories:",
    connection_string="redis://localhost:6379/0"
)
``` 