"""TTL operations for per-interview biometric state; callers hold their cache lock."""


def prune_expired(sessions, now):
    for key in [key for key, (_, expires_at) in sessions.items() if expires_at <= now]:
        sessions.pop(key, None)


def refresh_embedding(sessions, session_id, now, ttl):
    prune_expired(sessions, now)
    value = sessions.get(session_id)
    if value is None:
        return None
    sessions[session_id] = (value[0], now + ttl)
    return value[0]
