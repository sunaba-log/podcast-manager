"""Unit tests for storage backend implementations.

Tests the abstract interface and concrete implementations (GCS and R2).
These tests verify that both backends implement the required interface correctly.
"""

import unittest
from unittest.mock import MagicMock, patch

from app.lib.storage import StorageBackend
from app.lib.storage_gcs import GCSBackend
from app.lib.storage_r2 import R2Backend


class TestStorageBackendInterface(unittest.TestCase):
    """Test StorageBackend abstract interface."""

    def test_storage_backend_is_abstract(self):
        """StorageBackend should not be instantiable."""
        # We can't instantiate an abstract class
        with self.assertRaises(TypeError):
            StorageBackend()

    def test_storage_backend_requires_methods(self):
        """StorageBackend should require all abstract methods."""
        required_methods = [
            "generate_signed_url",
            "get_public_url",
            "delete_file",
            "file_exists",
            "get_file_size",
            "upload_from_string",
            "upload_from_file",
            "copy_to_backend",
        ]
        for method_name in required_methods:
            self.assertTrue(hasattr(StorageBackend, method_name), f"StorageBackend should have {method_name} method")


class TestGCSBackend(unittest.TestCase):
    """Test GCS backend implementation."""

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_backend_initialization(self, mock_client, mock_settings):
        """GCS backend should initialize with credentials."""
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        mock_client.return_value = MagicMock()

        backend = GCSBackend()
        self.assertEqual(backend.project_id, "test-project")
        self.assertEqual(backend.bucket_name, "test-bucket")

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_backend_missing_credentials(self, mock_client, mock_settings):
        """GCS backend should raise error if credentials missing."""
        mock_settings.GCS_PROJECT_ID = ""
        mock_settings.GCS_BUCKET_NAME = "test-bucket"

        with self.assertRaises(ValueError):
            GCSBackend()

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_generate_signed_url(self, mock_client, mock_settings):
        """GCS backend should generate signed URLs."""
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        mock_gcs_client = MagicMock()
        mock_bucket = MagicMock()
        mock_client.return_value = mock_gcs_client
        mock_gcs_client.bucket.return_value = mock_bucket

        backend = GCSBackend()

        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-url"
        mock_bucket.blob.return_value = mock_blob

        url = backend.generate_signed_url("test-file.mp3")

        self.assertEqual(url, "https://signed-url")
        mock_bucket.blob.assert_called_with("test-file.mp3")

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_get_public_url(self, mock_client, mock_settings):
        """GCS backend should return public URL."""
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        mock_client.return_value = MagicMock()

        backend = GCSBackend()
        url = backend.get_public_url("test-file.mp3")
        self.assertEqual(url, "https://storage.googleapis.com/test-bucket/test-file.mp3")

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_delete_file(self, mock_client, mock_settings):
        """GCS backend should delete files."""
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        mock_gcs_client = MagicMock()
        mock_bucket = MagicMock()
        mock_client.return_value = mock_gcs_client
        mock_gcs_client.bucket.return_value = mock_bucket

        backend = GCSBackend()
        success = backend.delete_file("test-file.mp3")
        self.assertTrue(success)
        mock_bucket.delete_blob.assert_called_with("test-file.mp3")

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_file_exists(self, mock_client, mock_settings):
        """GCS backend should check file existence."""
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        mock_gcs_client = MagicMock()
        mock_bucket = MagicMock()
        mock_client.return_value = mock_gcs_client
        mock_gcs_client.bucket.return_value = mock_bucket

        backend = GCSBackend()

        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_bucket.blob.return_value = mock_blob

        exists = backend.file_exists("test-file.mp3")
        self.assertTrue(exists)

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    def test_gcs_upload_from_string(self, mock_client, mock_settings):
        """GCS backend should upload from string."""
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        mock_gcs_client = MagicMock()
        mock_bucket = MagicMock()
        mock_client.return_value = mock_gcs_client
        mock_gcs_client.bucket.return_value = mock_bucket

        backend = GCSBackend()

        mock_blob = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        success = backend.upload_from_string(b"test data", "test-file.mp3", "audio/mpeg")

        self.assertTrue(success)
        mock_blob.upload_from_string.assert_called()


class TestR2Backend(unittest.TestCase):
    """Test R2 backend implementation."""

    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_r2_backend_initialization(self, mock_boto_client, mock_settings):
        """R2 backend should initialize with credentials."""
        mock_settings.R2_ACCOUNT_ID = "test-account"
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"
        mock_settings.R2_PUBLIC_URL = "https://cdn.example.com"
        mock_boto_client.return_value = MagicMock()

        backend = R2Backend()
        self.assertEqual(backend.account_id, "test-account")
        self.assertEqual(backend.bucket_name, "test-bucket")
        self.assertEqual(backend.public_url, "https://cdn.example.com")

    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_r2_backend_missing_credentials(self, mock_boto_client, mock_settings):
        """R2 backend should raise error if credentials missing."""
        mock_settings.R2_ACCOUNT_ID = ""
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"

        with self.assertRaises(ValueError):
            R2Backend()

    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_r2_generate_signed_url(self, mock_boto_client, mock_settings):
        """R2 backend should generate signed URLs."""
        mock_settings.R2_ACCOUNT_ID = "test-account"
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"
        mock_settings.R2_PUBLIC_URL = "https://cdn.example.com"
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client
        mock_s3_client.generate_presigned_url.return_value = "https://signed-url"

        backend = R2Backend()
        url = backend.generate_signed_url("test-file.mp3")

        self.assertEqual(url, "https://signed-url")
        mock_s3_client.generate_presigned_url.assert_called()

    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_r2_get_public_url(self, mock_boto_client, mock_settings):
        """R2 backend should return public URL."""
        mock_settings.R2_ACCOUNT_ID = "test-account"
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"
        mock_settings.R2_PUBLIC_URL = "https://cdn.example.com"
        mock_boto_client.return_value = MagicMock()

        backend = R2Backend()
        url = backend.get_public_url("test-file.mp3")
        self.assertEqual(url, "https://cdn.example.com/test-file.mp3")

    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_r2_delete_file(self, mock_boto_client, mock_settings):
        """R2 backend should delete files."""
        mock_settings.R2_ACCOUNT_ID = "test-account"
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"
        mock_settings.R2_PUBLIC_URL = "https://cdn.example.com"
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        backend = R2Backend()
        success = backend.delete_file("test-file.mp3")
        self.assertTrue(success)
        mock_s3_client.delete_object.assert_called()

    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_r2_upload_from_string(self, mock_boto_client, mock_settings):
        """R2 backend should upload from string."""
        mock_settings.R2_ACCOUNT_ID = "test-account"
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"
        mock_settings.R2_PUBLIC_URL = "https://cdn.example.com"
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        backend = R2Backend()
        success = backend.upload_from_string(b"test data", "test-file.mp3", "audio/mpeg")

        self.assertTrue(success)
        mock_s3_client.put_object.assert_called()


class TestBackendInterface(unittest.TestCase):
    """Test that both backends implement the same interface."""

    @patch("app.lib.storage_gcs.settings")
    @patch("app.lib.storage_gcs.storage.Client")
    @patch("app.lib.storage_r2.settings")
    @patch("app.lib.storage_r2.boto3.client")
    def test_backends_implement_interface(self, mock_r2_boto, mock_r2_settings, mock_gcs_client, mock_gcs_settings):
        """Both backends should implement StorageBackend interface."""
        mock_gcs_settings.GCS_PROJECT_ID = "test"
        mock_gcs_settings.GCS_BUCKET_NAME = "test"
        mock_gcs_client.return_value = MagicMock()

        mock_r2_settings.R2_ACCOUNT_ID = "test"
        mock_r2_settings.R2_ACCESS_KEY_ID = "test"
        mock_r2_settings.R2_SECRET_ACCESS_KEY = "test"
        mock_r2_settings.R2_BUCKET_NAME = "test"
        mock_r2_settings.R2_PUBLIC_URL = ""
        mock_r2_boto.return_value = MagicMock()

        gcs = GCSBackend()
        r2 = R2Backend()

        # Both should be instances of StorageBackend
        self.assertIsInstance(gcs, StorageBackend)
        self.assertIsInstance(r2, StorageBackend)


if __name__ == "__main__":
    unittest.main()


class TestStorageBackendInterface(unittest.TestCase):
    """Test StorageBackend abstract interface."""

    def test_storage_backend_is_abstract(self):
        """StorageBackend should not be instantiable."""
        # We can't instantiate an abstract class
        with self.assertRaises(TypeError):
            StorageBackend()

    def test_storage_backend_requires_methods(self):
        """StorageBackend should require all abstract methods."""
        required_methods = [
            "generate_signed_url",
            "get_public_url",
            "delete_file",
            "file_exists",
            "get_file_size",
            "upload_from_string",
            "upload_from_file",
            "copy_to_backend",
        ]
        for method_name in required_methods:
            self.assertTrue(hasattr(StorageBackend, method_name), f"StorageBackend should have {method_name} method")


class TestGCSBackend(unittest.TestCase):
    """Test GCS backend implementation."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_gcs_client = MagicMock()
        self.mock_bucket = MagicMock()
        self.mock_gcs_client.bucket.return_value = self.mock_bucket

        self.gcs_patcher = patch("app.lib.storage_gcs.storage.Client")
        self.settings_patcher = patch("app.lib.storage_gcs.settings")

        mock_client = self.gcs_patcher.start()
        mock_settings = self.settings_patcher.start()

        mock_client.return_value = self.mock_gcs_client
        mock_settings.GCS_PROJECT_ID = "test-project"
        mock_settings.GCS_BUCKET_NAME = "test-bucket"

        self.backend = GCSBackend()

    def tearDown(self):
        """Tear down test fixtures."""
        self.gcs_patcher.stop()
        self.settings_patcher.stop()

    def test_gcs_backend_initialization(self):
        """GCS backend should initialize with credentials."""
        self.assertEqual(self.backend.project_id, "test-project")
        self.assertEqual(self.backend.bucket_name, "test-bucket")

    def test_gcs_backend_missing_credentials(self):
        """GCS backend should raise error if credentials missing."""
        with patch("app.lib.storage_gcs.settings") as mock_settings:
            mock_settings.GCS_PROJECT_ID = ""
            mock_settings.GCS_BUCKET_NAME = "test-bucket"
            with self.assertRaises(ValueError):
                GCSBackend()

    def test_gcs_generate_signed_url(self):
        """GCS backend should generate signed URLs."""
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-url"
        self.mock_bucket.blob.return_value = mock_blob

        url = self.backend.generate_signed_url("test-file.mp3")

        self.assertEqual(url, "https://signed-url")
        self.mock_bucket.blob.assert_called_with("test-file.mp3")

    def test_gcs_get_public_url(self):
        """GCS backend should return public URL."""
        url = self.backend.get_public_url("test-file.mp3")
        self.assertEqual(url, "https://storage.googleapis.com/test-bucket/test-file.mp3")

    def test_gcs_delete_file(self):
        """GCS backend should delete files."""
        success = self.backend.delete_file("test-file.mp3")
        self.assertTrue(success)
        self.mock_bucket.delete_blob.assert_called_with("test-file.mp3")

    def test_gcs_file_exists(self):
        """GCS backend should check file existence."""
        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        self.mock_bucket.blob.return_value = mock_blob

        exists = self.backend.file_exists("test-file.mp3")

        self.assertTrue(exists)

    def test_gcs_upload_from_string(self):
        """GCS backend should upload from string."""
        mock_blob = MagicMock()
        self.mock_bucket.blob.return_value = mock_blob

        success = self.backend.upload_from_string(b"test data", "test-file.mp3", "audio/mpeg")

        self.assertTrue(success)
        mock_blob.upload_from_string.assert_called()


class TestR2Backend(unittest.TestCase):
    """Test R2 backend implementation."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_s3_client = MagicMock()

        self.r2_patcher = patch("app.lib.storage_r2.boto3.client")
        self.settings_patcher = patch("app.lib.storage_r2.settings")

        mock_boto_client = self.r2_patcher.start()
        mock_settings = self.settings_patcher.start()

        mock_boto_client.return_value = self.mock_s3_client
        mock_settings.R2_ACCOUNT_ID = "test-account"
        mock_settings.R2_ACCESS_KEY_ID = "test-key"
        mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
        mock_settings.R2_BUCKET_NAME = "test-bucket"
        mock_settings.R2_PUBLIC_URL = "https://cdn.example.com"

        self.backend = R2Backend()

    def tearDown(self):
        """Tear down test fixtures."""
        self.r2_patcher.stop()
        self.settings_patcher.stop()

    def test_r2_backend_initialization(self):
        """R2 backend should initialize with credentials."""
        self.assertEqual(self.backend.account_id, "test-account")
        self.assertEqual(self.backend.bucket_name, "test-bucket")
        self.assertEqual(self.backend.public_url, "https://cdn.example.com")

    def test_r2_backend_missing_credentials(self):
        """R2 backend should raise error if credentials missing."""
        with patch("app.lib.storage_r2.settings") as mock_settings:
            mock_settings.R2_ACCOUNT_ID = ""
            mock_settings.R2_ACCESS_KEY_ID = "test-key"
            mock_settings.R2_SECRET_ACCESS_KEY = "test-secret"
            mock_settings.R2_BUCKET_NAME = "test-bucket"
            with self.assertRaises(ValueError):
                R2Backend()

    def test_r2_generate_signed_url(self):
        """R2 backend should generate signed URLs."""
        self.mock_s3_client.generate_presigned_url.return_value = "https://signed-url"

        url = self.backend.generate_signed_url("test-file.mp3")

        self.assertEqual(url, "https://signed-url")
        self.mock_s3_client.generate_presigned_url.assert_called()

    def test_r2_get_public_url(self):
        """R2 backend should return public URL."""
        url = self.backend.get_public_url("test-file.mp3")
        self.assertEqual(url, "https://cdn.example.com/test-file.mp3")

    def test_r2_delete_file(self):
        """R2 backend should delete files."""
        success = self.backend.delete_file("test-file.mp3")
        self.assertTrue(success)
        self.mock_s3_client.delete_object.assert_called()

    def test_r2_upload_from_string(self):
        """R2 backend should upload from string."""
        success = self.backend.upload_from_string(b"test data", "test-file.mp3", "audio/mpeg")

        self.assertTrue(success)
        self.mock_s3_client.put_object.assert_called()


class TestBackendInterface(unittest.TestCase):
    """Test that both backends implement the same interface."""

    def test_backends_implement_interface(self):
        """Both backends should implement StorageBackend interface."""
        with patch("app.lib.storage_gcs.storage.Client") as mock_gcs_client:
            with patch("app.lib.storage_gcs.settings") as mock_gcs_settings:
                mock_gcs_client.return_value = MagicMock()
                mock_gcs_settings.GCS_PROJECT_ID = "test"
                mock_gcs_settings.GCS_BUCKET_NAME = "test"
                gcs = GCSBackend()

        with patch("app.lib.storage_r2.boto3.client") as mock_r2_client:
            with patch("app.lib.storage_r2.settings") as mock_r2_settings:
                mock_r2_client.return_value = MagicMock()
                mock_r2_settings.R2_ACCOUNT_ID = "test"
                mock_r2_settings.R2_ACCESS_KEY_ID = "test"
                mock_r2_settings.R2_SECRET_ACCESS_KEY = "test"
                mock_r2_settings.R2_BUCKET_NAME = "test"
                mock_r2_settings.R2_PUBLIC_URL = ""
                r2 = R2Backend()

        # Both should be instances of StorageBackend
        self.assertIsInstance(gcs, StorageBackend)
        self.assertIsInstance(r2, StorageBackend)


if __name__ == "__main__":
    unittest.main()
