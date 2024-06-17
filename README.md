# movie-replicator

Replicator of the movie database used for [oklezzgo](https://github.com/fethca/oklezzgo). 

## Prerequisites

Before installing movie-replicator, ensure you have the following prerequisites met:

- Node.js installed on your system
- pnpm package manager installed
- A redis cache
- A mongoDB with a .pem certificate

### Installation

To install the required node modules for movie-replicator, run the following command:

```sh
pnpm install
```

### Environment Setup

Create a `.env` file at the root directory of your project and include the following environment variables:

```
APP_STAGE=dev

```
