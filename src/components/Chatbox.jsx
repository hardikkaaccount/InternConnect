import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT;
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET; // ❗ keep this on backend in real apps

const operationsDoc = `
  query GetChatsByClass($grpid: uuid!) {
    chat_rooms_by_pk(id: $grpid) {
      id
      name
      messages(order_by: {created_at: asc}) {
        id
        content
        user_id
        created_at
        user {
          name
        }
      }
    }
  }

  mutation InsertMessage($content: String!, $user_id: uuid!, $chat_room_id: uuid!) {
    insert_messages(
      objects: {content: $content, user_id: $user_id, chat_room_id: $chat_room_id}
    ) {
      returning {
        id
        content
        user_id
        chat_room_id
        created_at
        user {
          name
        }
      }
    }
  }
`;

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const res = await fetch(HASURA_ENDPOINT, {
    method: "POST",
    headers: {
      "x-hasura-admin-secret": ADMIN_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: operationsDoc,
      operationName,
      variables,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || "Network error");
  }
  return json;
}

const Chatbox = ({ loggedInUser }) => {
  // 👇 get :groupId from the URL /groups/:groupId
  const { groupId } = useParams(); // this is your "class room / group id"
  const chatRoomId = groupId;      // alias to keep naming clear

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [grpName, setGrpName] = useState("");

  const getChatsInGroup = async () => {
    if (!chatRoomId) return;
    setLoadingMessages(true);
    setError(null);

    try {
      const { data, errors } = await fetchGraphQL(
        operationsDoc,
        "GetChatsByClass",
        { grpid: chatRoomId }
      );

      if (errors && errors.length) {
        setError(errors[0].message);
        return;
      }

      if (!data?.chat_rooms_by_pk) {
        setMessages([]);
        setError("Chat room not found");
        return;
      }

      setMessages(data.chat_rooms_by_pk.messages || []);
      setGrpName(data.chat_rooms_by_pk.name || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    getChatsInGroup();
    // Optional: polling if you want live updates
    // const interval = setInterval(getChatsInGroup, 5000);
    // return () => clearInterval(interval);
  }, [chatRoomId]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!chatRoomId) {
      setError("No chat room selected");
      return;
    }

    if (!loggedInUser) {
      setError("User not logged in");
      return;
    }

    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);

    try {
      const { data, errors } = await fetchGraphQL(
        operationsDoc,
        "InsertMessage",
        {
          content: newMessage.trim(),
          user_id: loggedInUser.id,
          chat_room_id: chatRoomId,
        }
      );

      if (errors && errors.length) {
        setError(errors[0].message);
        return;
      }

      setNewMessage("");

      // append newly inserted message
      const inserted = data?.insert_messages?.returning?.[0];
      if (inserted) {
        setMessages((prev) => [...prev, inserted]);
      } else {
        // fallback: refetch
        getChatsInGroup();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Chat Room: {grpName || "No room selected"}</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="chat-container">
        <div className="messages">
          {loadingMessages ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="message">
                <div className="message-header">
                  <span className="username">{m.user?.name || m.user_id}</span>
                  <span className="timestamp">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="content">{m.content}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="form-control"
          />
          <button
            type="submit"
            disabled={sending || !chatRoomId}
            className="btn btn-primary"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbox;