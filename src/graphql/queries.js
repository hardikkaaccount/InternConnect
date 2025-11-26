import { gql } from '@apollo/client'

export const GET_MESSAGES = gql`
  subscription GetMessages {
    messages(order_by: {created_at: asc}) {
      id
      content
      user_id
      chat_room_id
      created_at
      user {
        id
        name
      }
    }
  }
`

export const INSERT_MESSAGE = gql`
  mutation InsertMessage($content: String!, $userId: uuid!, $chatRoomId: uuid!) {
    insert_messages_one(object: {content: $content, user_id: $userId, chat_room_id: $chatRoomId}) {
      id
      content
      user_id
      chat_room_id
      created_at
      user {
        id
        name
      }
    }
  }
`

export const INSERT_USER = gql`
  mutation InsertUser($name: String!) {
    insert_users_one(object: {name: $name, email: "${Math.random()}@example.com", password_hash: "password"}) {
      id
      name
    }
  }
`

export const INSERT_CHAT_ROOM = gql`
  mutation InsertChatRoom($name: String!, $createdBy: uuid!) {
    insert_chat_rooms_one(object: {name: $name, created_by: $createdBy}) {
      id
      name
    }
  }
`

