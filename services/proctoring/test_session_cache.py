import unittest
from session_cache import prune_expired, refresh_embedding


class SessionCacheTests(unittest.TestCase):
    def test_active_interview_keeps_its_original_baseline_past_fifteen_minutes(self):
        baseline = object()
        sessions = {'candidate-a': (baseline, 900)}
        self.assertIs(refresh_embedding(sessions, 'candidate-a', now=800, ttl=900), baseline)
        self.assertIs(refresh_embedding(sessions, 'candidate-a', now=1000, ttl=900), baseline)

    def test_candidates_remain_isolated_and_idle_baselines_expire(self):
        a, b = object(), object()
        sessions = {'candidate-a': (a, 900), 'candidate-b': (b, 1200)}
        self.assertIsNone(refresh_embedding(sessions, 'candidate-a', now=901, ttl=900))
        self.assertIs(refresh_embedding(sessions, 'candidate-b', now=901, ttl=900), b)
        self.assertNotIn('candidate-a', sessions)

    def test_periodic_pruning_removes_expired_biometric_state(self):
        sessions = {'expired': (object(), 5), 'active': (object(), 15)}
        prune_expired(sessions, now=10)
        self.assertEqual(list(sessions), ['active'])


if __name__ == '__main__':
    unittest.main()
