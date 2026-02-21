from unittest.mock import MagicMock, patch


def test_start_scheduler_calls_job_with_interval():
    from ingestion.scheduler import start_scheduler

    mock_fn = MagicMock()

    with patch("ingestion.scheduler.BackgroundScheduler") as MockScheduler:
        mock_instance = MagicMock()
        MockScheduler.return_value = mock_instance

        sched = start_scheduler(mock_fn)

        mock_instance.add_job.assert_called_once_with(mock_fn, "interval", minutes=15)
        mock_instance.start.assert_called_once()
        assert sched is mock_instance


def test_start_scheduler_returns_scheduler_instance():
    from ingestion.scheduler import start_scheduler

    mock_fn = MagicMock()

    with patch("ingestion.scheduler.BackgroundScheduler") as MockScheduler:
        mock_instance = MagicMock()
        MockScheduler.return_value = mock_instance

        result = start_scheduler(mock_fn)

        assert result is mock_instance
