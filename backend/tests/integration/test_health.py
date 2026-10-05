from fastapi.testclient import TestClient


def test_health_returns_ok_status_when_api_is_running(client: TestClient) -> None:
    # Arrange
    url = "/api/health"

    # Act
    response = client.get(url)

    # Assert
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
