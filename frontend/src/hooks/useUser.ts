// src/hooks/useUser.ts
import { useState, useEffect } from 'react';

export const useUser = () => {
  const [userId, setUserId] = useState<string | number | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("vivuplan_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      setUserId(parsed.id);
      setUserInfo(parsed);
    }
  }, []);

  return { userId, userInfo };
};