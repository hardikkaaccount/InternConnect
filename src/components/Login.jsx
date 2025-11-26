import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT;
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

const Groups = ({ loggedInUser }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [newGroup, setNewGroup] = useState('');
  const [createdBy, setCreatedBy] = useState(null);

  const navigate = useNavigate();

  // ✅ Use loggedInUser from props, NOT localStorage
  useEffect(() => {
    if (loggedInUser?.id) {
      setCreatedBy(loggedInUser.id);
    } else {
      setCreatedBy(null);
    }
  }, [loggedInUser]);

  const getClassesQuery = `
    query getClasses {
      chat_rooms {
        id
        name
      }
    }
  `;

  const addClassMutation = `
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

  async function fetchGraphQL(query, operationName, variables = {}) {
    const res = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ADMIN_SECRET, // ⚠️ dev only, not for production
      },
      body: JSON.stringify({
        query,
        operationName,
        variables,
      }),
    });

    return res.json();
  }

  async function fetchGroups() {
    setLoading(true);
    setError(null);

    try {
      const { data, errors } = await fetchGraphQL(getClassesQuery, 'getClasses', {});
      if (errors && errors.length) {
        setError(errors[0].message || 'Failed to fetch groups');
        console.error('Error groups:', errors[0].message);
      } else {
        setGroups(data?.chat_rooms ?? []);
      }
    } catch (err) {
      setError(err.message || 'Network error fetching groups');
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

    setAdding(true);
    setError(null);

    try {
      const { data, errors } = await fetchGraphQL(
        addClassMutation,
        'AddClass',
        { name: trimmed, created_by: createdBy } // ✅ pass created_by
      );

      if (errors && errors.length) {
        setError(errors[0].message || 'Failed to add group');
        console.log('Error adding group:', errors[0].message);
        return;
      }

      const added = data?.insert_chat_rooms?.returning?.[0];
      if (added) {
        setGroups((prev) => [added, ...prev]);
        setNewGroup('');
      } else {
        await fetchGroups();
      }
    } catch (err) {
      setError(err.message || 'Network error adding group');
      console.log('Error adding group:', err.message);
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div>
      <h1>Groups</h1>

      <div>
        <input
          type="text"
          id="group-name"
          placeholder="Group name"
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
        />
        <button onClick={() => addGroup(newGroup)} disabled={adding}>
          {adding ? 'Adding...' : 'Add group'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <ul
        style={{
          border: '1px solid black',
          padding: '10px',
          width: '300px',
        }}
      >
        {loading && <p>Loading...</p>}
        {groups.map((group) => (
          <span
            key={group.id}
            style={{
              border: '1px solid black',
              padding: '20px',
              margin: '5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderRadius: '5px',
              background: 'lightgray',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'left',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            {group.name}
          </span>
        ))}
      </ul>
    </div>
  );
};

export default Groups;
