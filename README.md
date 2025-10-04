# ActivityPub Relay

This is a simple ActivityPub relay server built with Bun and TypeScript.

## Prerequisites

- [Bun](https://bun.sh/)

## Getting Started

### 1. Install Dependencies

First, install the project dependencies using Bun:

```bash
bun install
```

### 2. Configure Environment Variables

Next, you need to set up your environment variables. Copy the example file to a new `.env` file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the required values:

- `HOSTNAME`: The hostname of your server (e.g., `relay.example.com`).
- `PUBLICKEY`: Your actor's public key. You can generate a key pair using OpenSSL:
  ```bash
  # Generate a private key
  openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
  # Extract the public key
  openssl rsa -pubout -in private_key.pem -out public_key.pem
  ```
  Then, copy the content of `public_key.pem` into the `PUBLICKEY` variable.
- `DB_FILE`: The path where the SQLite database file will be stored (e.g., `./data/db.sqlite3`). Make sure the directory exists.

### 3. Run the Server

Once your environment is configured, you can start the server:

```bash
bun run start
```

For development, you can use the `dev` script to automatically restart the server on file changes:

```bash
bun run dev
```

The server will be running at `http://0.0.0.0:3000`.