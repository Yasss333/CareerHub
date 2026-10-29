import unittest
from unittest.mock import patch

import transcription


class TranscriptionTests(unittest.TestCase):
    def test_empty_audio_never_invents_a_transcript(self):
        self.assertEqual(transcription.transcribe(b'', 'audio/webm'), {'success': True, 'text': '', 'engine': 'none'})

    def test_cloud_failure_uses_the_local_fallback(self):
        with patch.dict('os.environ', {'GROQ_API_KEY': 'test-only'}), \
             patch.object(transcription, '_cloud_transcribe', side_effect=RuntimeError('offline')), \
             patch.object(transcription, '_local_transcribe', return_value='An actual answer'):
            result = transcription.transcribe(b'a' * 2000, 'audio/webm')
        self.assertEqual(result['text'], 'An actual answer')
        self.assertEqual(result['engine'], 'local-whisper')

    def test_inference_failure_remains_an_error(self):
        with patch.dict('os.environ', {'GROQ_API_KEY': ''}), \
             patch.object(transcription, '_local_transcribe', side_effect=RuntimeError('model unavailable')):
            with self.assertRaises(RuntimeError):
                transcription.transcribe(b'a' * 2000, 'audio/webm')

    def test_valid_short_phrases_are_preserved(self):
        with patch.dict('os.environ', {'GROQ_API_KEY': ''}), \
             patch.object(transcription, '_local_transcribe', return_value="I'm sorry, let me clarify the tradeoff."):
            result = transcription.transcribe(b'a' * 2000, 'audio/webm')
        self.assertIn("I'm sorry", result['text'])


if __name__ == '__main__':
    unittest.main()
