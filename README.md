# Real-time Chat App with React, Hasura, and PostgreSQL

A simple real-time chat application built with React, Hasura, and PostgreSQL (using Neon).

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up your Hasura instance:
   - Create a Hasura Cloud account or set up a local instance
   - Create a PostgreSQL database (we recommend using Neon)
   - Update the `.env` file with your Hasura endpoints and admin secret

3. Create the messages table in your database:
   ```sql
   CREATE TABLE messages (
     id SERIAL PRIMARY KEY,
     text TEXT NOT NULL,
     user TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

4. Run the development server:
   ```
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:
- `VITE_HASURA_HTTP`: Your Hasura HTTP endpoint
- `VITE_HASURA_WS`: Your Hasura WebSocket endpoint
- `VITE_HASURA_ADMIN_SECRET`: Your Hasura admin secret

## Features

- Real-time messaging using GraphQL subscriptions
- Simple username selection
- Responsive design