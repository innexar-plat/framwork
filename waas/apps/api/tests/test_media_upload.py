"""Tests for media upload endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_media_upload_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert response.status_code in (401, 403)
