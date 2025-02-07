import time
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

@contextmanager
def profiler(name: str):
    """Context manager for timing code blocks"""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        logger.info(f"{name} took {duration:.2f} seconds") 