# Sajari Tutorial with Node.js
A tutorial for Sajari's no results page.

## Prerequisites

The following are required to run this website:

1. Node.js >= 12
2. MySQL server
3. Sajari Account

## Installation

1. Copy `.env.sample` to `.env` and fill your Sajari credentials that you got from Sajari's Console.
2. Copy `database/config.js.sample` to `database/config.js` and enter the details related to your database server.
3. Run `npm install` to install the dependencies.
4. Import `sql/ecommerce.sql` to your MySQL server which will create a new database with the necessary data in it.

## Running the Server

To run the server:

```bash
npm start
```

This will run the server on `localhost:7000`.

## License

[MIT](./LICENSE)