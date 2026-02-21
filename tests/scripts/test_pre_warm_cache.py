from unittest.mock import patch, MagicMock


@patch("scripts.pre_warm_cache.httpx.get")
def test_pre_warm_hits_all_user_endpoints(mock_get):
    """warm() must hit /feed, /spend-map, and /tip for every user."""
    mock_get.return_value = MagicMock(status_code=200)

    from scripts.pre_warm_cache import warm
    warm()

    called_urls = [str(c.args[0]) for c in mock_get.call_args_list]

    for user in ["mock_user_1", "mock_user_2"]:
        assert any(f"/feed?user_id={user}" in u for u in called_urls), f"missing /feed for {user}"
        assert any(f"/spend-map?user_id={user}" in u for u in called_urls), f"missing /spend-map for {user}"
        assert any(f"/tip?user_id={user}" in u for u in called_urls), f"missing /tip for {user}"


@patch("scripts.pre_warm_cache.httpx.get")
def test_pre_warm_hits_shared_endpoints(mock_get):
    """warm() must hit /trends and a set of /eli10 concepts."""
    mock_get.return_value = MagicMock(status_code=200)

    from scripts.pre_warm_cache import warm
    warm()

    called_urls = [str(c.args[0]) for c in mock_get.call_args_list]

    assert any("/trends" in u for u in called_urls), "missing /trends"
    assert any("/eli10/" in u for u in called_urls), "missing /eli10"
