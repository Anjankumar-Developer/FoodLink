import logging
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import *  # noqa: F401,F403
from app.services.data_loader import DataLoader
from app.services.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)


def generate_seed_matches(session) -> int:
    """Populate the matches table from the loaded donation and shelter datasets.

    This keeps the app production-ready without forcing a manual match-generation
    step in the UI. Only generate records when the table is empty so repeated
    startup calls do not duplicate data.
    """
    existing_count = session.query(Match).count()
    if existing_count > 0:
        logger.info("Match table already contains %s rows; skipping automatic generation.", existing_count)
        return existing_count

    matching_engine = MatchingEngine(session)
    donations = session.query(Donation).order_by(Donation.id).all()
    generated_total = 0

    for donation in donations:
        saved_matches = matching_engine.generate_and_save_matches_for_donation(str(donation.id))
        generated_total += len(saved_matches)

    logger.info("Generated %s match rows from %s donations.", generated_total, len(donations))
    return generated_total


def init_db(reset: bool = False) -> None:
    """Create tables and seed the SQLite database with the bundled CSV datasets.

    The app should not delete the live SQLite file during normal startup; that can
    fail when the database is already open by a running server or when startup is
    triggered more than once. For a clean reset, use an explicit maintenance flow
    instead of the normal application bootstrap path.
    """
    if reset:
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)

    data_dir = Path(__file__).resolve().parents[2] / "datasets" / "Datasets"
    if not data_dir.exists():
        logger.warning("Dataset directory not found at %s; database tables were created without seeding.", data_dir)
        return

    try:
        with SessionLocal() as session:
            loader = DataLoader(session)
            counts = loader.load_all_data()
            generate_seed_matches(session)
            logger.info("Database initialization complete with dataset counts: %s", counts)
    except Exception as exc:  # pragma: no cover - defensive bootstrapping
        logger.exception("Database tables were created but dataset seeding failed: %s", exc)


if __name__ == "__main__":
    init_db()