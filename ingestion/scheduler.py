from apscheduler.schedulers.background import BackgroundScheduler


def start_scheduler(refresh_fn) -> BackgroundScheduler:
    """
    Start a background scheduler that calls refresh_fn every 15 minutes.
    Returns the scheduler instance so the caller can shut it down on app exit.
    """
    scheduler = BackgroundScheduler()
    scheduler.add_job(refresh_fn, "interval", minutes=15)
    scheduler.start()
    return scheduler
