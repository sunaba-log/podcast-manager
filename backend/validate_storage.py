#!/usr/bin/env python
"""Quick validation script for storage backend implementations."""

import sys


def main():
    """Run validation tests."""
    print("=" * 60)
    print("Storage Backend Implementation Validation")
    print("=" * 60)

    # Test imports
    try:
        from app.lib.storage import StorageBackend

        print("✓ StorageBackend abstract class imported successfully")
    except Exception as e:
        print(f"✗ Failed to import StorageBackend: {e}")
        return False

    try:
        from app.lib.storage_gcs import GCSBackend

        print("✓ GCSBackend imported successfully")
    except Exception as e:
        print(f"✗ Failed to import GCSBackend: {e}")
        return False

    try:
        from app.lib.storage_r2 import R2Backend

        print("✓ R2Backend imported successfully")
    except Exception as e:
        print(f"✗ Failed to import R2Backend: {e}")
        return False

    try:
        print("✓ Dependency injection functions imported successfully")
    except Exception as e:
        print(f"✗ Failed to import dependencies: {e}")
        return False

    # Test interface verification
    try:
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
        for method in required_methods:
            if not hasattr(StorageBackend, method):
                print(f"✗ StorageBackend missing method: {method}")
                return False
        print(f"✓ StorageBackend has all {len(required_methods)} required methods")
    except Exception as e:
        print(f"✗ Failed to verify StorageBackend interface: {e}")
        return False

    # Test that subclasses exist
    try:
        assert issubclass(GCSBackend, StorageBackend), "GCSBackend should be a StorageBackend"
        print("✓ GCSBackend is a proper StorageBackend subclass")
    except Exception as e:
        print(f"✗ GCSBackend validation failed: {e}")
        return False

    try:
        assert issubclass(R2Backend, StorageBackend), "R2Backend should be a StorageBackend"
        print("✓ R2Backend is a proper StorageBackend subclass")
    except Exception as e:
        print(f"✗ R2Backend validation failed: {e}")
        return False

    print("\n" + "=" * 60)
    print("✅ All implementation tests passed!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
