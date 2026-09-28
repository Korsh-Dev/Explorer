# Korsh Explorer [KSH]

<p align="center">
  <img src="public/img/korsh.png" alt="Korsh (KSH)" width="150">
</p>

[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](./LICENSE)
[![Based on eIquidus](https://img.shields.io/badge/based_on-eIquidus-ffbd11.svg)](https://github.com/team-exor/eiquidus)

**Korsh Explorer** is the block explorer for the **Korsh (KSH)** network — a decentralized, CPU-mineable cryptocurrency with deterministic masternodes, 60-second blocks and a capped supply of 10,000,000 KSH.

Written in Node.js and MongoDB and built on top of [eIquidus](https://github.com/team-exor/eiquidus), it indexes the full Korsh blockchain in real time and serves the data through a web interface and a public JSON API.

## Features

- Full indexing of blocks, transactions and addresses, with accurate send/receive balances and per-address transaction history
- Richlist (top 100 addresses) computed from live indexed balances and circulating supply
- Masternode list, masternode tracking and movement pages
- Network stats: difficulty, network hashrate, block reward schedule and peer information
- Public JSON API (`/api` and `/ext` endpoints) suitable for wallets, pools and bots
- Works with `txindex=0` daemons: spent-input addresses are resolved from locally indexed block data instead of relying on the node's transaction index
- Themeable UI with multi-language support

## Security & Hardening

Korsh Explorer has undergone comprehensive security audits and hardening to ensure production reliability, resilience against malicious payloads, and high-performance concurrency:

- **Web Security & Input Validation:**
  - **Host Header Poisoning & RPC Protection:** Enforces strict domain allowlists and regex validation preventing SSRF and DNS rebinding attacks against internal RPC interfaces.
  - **Cross-Site Scripting (XSS) Mitigation:** Context-aware HTML entity sanitization applied across dynamic inputs, chart datasets, and Pug templates (`market.pug`, `masternodes.pug`, `claim_address.pug`).
  - **AJAX Header Spoofing Defense:** State-changing and AJAX-only endpoints utilize cryptographically generated HMAC session tokens (`X-Requested-With-Token`) rather than relying purely on client-supplied headers.
  - **ReDoS Protection:** User input supplied to regular expressions across search and routing handlers is safely escaped to eliminate catastrophic backtracking.
  - **Safe Object Property Traversal:** Replaced dynamic string evaluations (`eval()`) with safe path-traversal primitives (`setByString`, `deleteByString`).
  - **QR Code DoS Prevention:** Strict payload length limitations (maximum 500 characters) enforced on dynamic QR generation routes.
  - **Sensitive Data Redaction:** Database connection strings, credentials, and authentication tokens are masked prior to being written to system logs.

- **Concurrency & Process Stability:**
  - **Deadlock-Free Sync Queue:** Multi-threaded block synchronizer implements strict slot release (`async.queue` callback safety) under all error paths and network timeouts.
  - **Atomic Queue Flow:** Guaranteed retry backoff counter increments to prevent runaway infinite polling loops on unreachable peers.
  - **Process Management:** Fully compatible with modern Node.js cluster APIs (`cluster.isPrimary`) and robust cross-platform worker process lifecycle management (Linux & Windows).

- **Database Integrity & Math Safety:**
  - **NoSQL Injection Defenses:** Parameterized query sanitization and explicit primitive type verification across all API and claim endpoints.
  - **Safe Decimal Arithmetic:** High-precision monetary calculations leverage `bignumber.js` and `Decimal.js` with zero-division guards across supply, distribution, and market conversion endpoints.
  - **Strict Scoping:** Full elimination of accidental global variable declarations (`global.i`, undeclared iterators) to prevent context pollution.

- **Dependency Security Overrides:**
  - Core transitive dependencies patched against known CVEs via `package.json` overrides (`minimist`, `braces`, `micromatch`, `form-data`, `nconf`, `tough-cookie`, `decode-uri-component`, `js-yaml`, `qs`).

## Requirements

| Software | Recommended |
| :--- | :--- |
| [Node.js](https://nodejs.org/) | v20.9.0 or newer |
| [MongoDB](https://www.mongodb.com/) | v7.0.2 or newer |
| [Git](https://git-scm.com/) | v2.36.0 or newer |
| `korshd` | A fully synchronized Korsh daemon with RPC enabled (mainnet RPC port: **9776**) |

## Installation

### 1. Install prerequisites

The recommended way to install Node.js is via NVM:

```
sudo apt update
sudo apt install curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install --lts
```

Install MongoDB following the [official documentation](https://www.mongodb.com/docs/manual/installation/) for your OS. MongoDB 7.x is recommended.

### 2. Set up the database

```
mongosh
```

```
> use explorerdb
> db.createUser({ user: "eiquidus", pwd: "<your-password>", roles: [ "readWrite" ] })
```

### 3. Clone and install

```
git clone https://github.com/Korsh-Dev/Explorer.git
cd Explorer
npm install
```

### 4. Configure the explorer

```
cp settings.json.template settings.json
nano settings.json
```

Set at minimum:

- **`dbsettings`** — MongoDB user, password and port (default `27017`)
- **`wallet`** — host, port, username and password of your `korshd` RPC (Korsh mainnet default: port `9776`)
- **`website`** — the port the web interface listens on (default `3001`)

### 5. First sync

Index the blockchain from the genesis block:

```
node ./scripts/sync.js index
```

For a full reindex on a live server, run it inside `tmux` or `screen` instead, since the web service must stay stopped while it runs:

```
node --stack-size=10000 ./scripts/sync.js index reindex
```

A full sync of the Korsh chain takes roughly 45 minutes on a small VPS.

### 6. Start the explorer

```
npm start                 # production, cluster mode
npm run start-instance    # single instance
```

Or with PM2:

```
npm run start-pm2         # start
npm run stop-pm2          # stop
npm run reload-pm2        # reload
```

## Useful scripts

| Command | Description |
| :--- | :--- |
| `npm run sync-blocks` | Incrementally index new blocks (run via cron) |
| `npm run sync-masternodes` | Update the masternode list |
| `npm run sync-markets` | Update market/exchange data |
| `npm run sync-peers` | Update peer information |
| `npm run reindex` | Full reindex (wipes the database and resyncs from genesis) |
| `npm run reindex-rich` | Rebuild richlist data |
| `npm run check-blocks` | Verify block integrity |
| `npm run create-backup` | Back up the explorer database |
| `npm run restore-backup` | Restore the explorer database |
| `npm run update-explorer` | Pull the latest explorer code |

Sample crontab entry to keep the index up to date:

```
* * * * * cd /path/to/Explorer && npm run sync-blocks > /dev/null 2>&1
*/5 * * * * cd /path/to/Explorer && npm run sync-masternodes > /dev/null 2>&1
```

## API

A public JSON API is available for wallets, pools and third-party integrations. Common endpoints:

- `/api/getblockcount` — current block height
- `/api/getdifficulty` — current proof-of-work difficulty
- `/api/getconnectioncount` — peer count
- `/api/getblockhash?index=<height>` — block hash at a height
- `/api/getblock?hash=<hash>` — block data
- `/api/getrawtransaction?txid=<txid>&decrypt=1` — transaction data
- `/api/getmasternodecount` — masternode count
- `/ext/getbalance/<address>` — address balance
- `/ext/getlasttxs/<address>/<count>` — latest transactions for an address
- `/ext/getmoneysupply` — current circulating supply

## Korsh network parameters

| Parameter | Value |
| :--- | :--- |
| **RPC port** | 9776 |
| **P2P port** | 9777 |
| **Block time** | 60 seconds |
| **Max supply** | 10,000,000 KSH |

The explorer reads live data from a synced `korshd` node over RPC. The node does **not** need `txindex` enabled: spent-input addresses are resolved from the explorer's own indexed block data.

## Credits

Korsh Explorer is a fork of [eIquidus](https://github.com/team-exor/eiquidus), the open-source block explorer created by [Team Exor](https://github.com/team-exor), which in turn descends from the original [Iquidus explorer](https://github.com/iquidus/explorer) by Luke Williams and incorporates work from the Chaincoin community. All upstream copyright notices are preserved.

Adapted and maintained for the Korsh network by the [Korsh-Dev](https://github.com/Korsh-Dev) team.

## License

BSD 3-Clause License. See [LICENSE](LICENSE) for the full text.
