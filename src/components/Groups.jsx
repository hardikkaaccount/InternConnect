import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './groups.css';

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT;
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

const Groups = ({ loggedInUser }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newGroup, setNewGroup] = useState('');
  const [createdBy, setCreatedBy] = useState(null);

  useEffect(() => {
    if (loggedInUser?.id) {
      setCreatedBy(loggedInUser.id);
    } else {
      setCreatedBy(null);
    }
  }, [loggedInUser]);

  const navigate = useNavigate();

  const operationsDoc = `
    query getClasses {
      chat_rooms {
        id
        name
        created_by
      }
    }
    
    mutation AddClass($name: String!, $created_by: uuid!) {
      insert_chat_rooms(objects: { name: $name, created_by: $created_by }) {
        affected_rows
        returning {
          id
          name
        }
      }
    }
  `;

  async function fetchGraphQL(operationsDoc, operationName, variables) {
    const res = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': ADMIN_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: operationsDoc,
        operationName,
        variables,
      }),
    });
    return await res.json();
  }

  async function fetchGroups() {
    setLoading(true);
    setError(null);

    try {
      const { data, errors } = await fetchGraphQL(operationsDoc, 'getClasses', {});
      if (errors && errors.length) {
        setError(errors[0].message);
        console.log('Error groups:', errors[0].message);
      } else {
        setGroups(data.chat_rooms);
      }
    } catch (err) {
      setError(err.message);
      console.log('Error fetching groups:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addGroup(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!createdBy) {
      setError('User not found, cannot create group');
      console.log('createdBy is null/undefined, loggedInUser:', loggedInUser);
      return;
    }

    try {
      const { data, errors } = await fetchGraphQL(operationsDoc, 'AddClass', { name: trimmed, created_by: createdBy });
      if (errors && errors.length) {
        setError(errors[0].message);
        console.log('Error adding group:', errors[0].message);
        return;
      }
      console.log('Group added:', data.insert_chat_rooms.returning[0].name);
      setNewGroup('');
      await fetchGroups();
    } catch (err) {
      setError(err.message);
      console.log('Error adding group:', err.message);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div>
      <h1>Groups</h1>
      <div className="group-input">
        <input
          type="text"
          id="group-name"
          placeholder="Group name"
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
        />
        <button onClick={() => addGroup(newGroup)}>Add group</button>
      </div>
      <ul
        style={{
          border: '1px solid black',
          padding: '10px',
        }}
      >
        {groups.map((group) => (
          <div key={group.id} className="group-item"
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            {group.name}
            <span className="created-by">Created by: {group.created_by === createdBy ? 'You' : 'Someone else'}</span>
          </div>
        ))}
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
      </ul>
    </div>
  );
};

export default Groups;