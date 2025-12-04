import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function makeId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  useEffect(() => {
    const movie = search.get('movie') || '';
    const sessionId = makeId(12);
    // Navigate to the group watch URL with movie query
    navigate(`/group/${sessionId}?movie=${encodeURIComponent(movie)}`);
  }, [navigate, search]);

  return <div>Creating room...</div>;
};

export default CreateRoom;
