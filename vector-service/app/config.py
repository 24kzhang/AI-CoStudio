from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass, field
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parent.parent
def model_base_url() -> str:
    configured = os.getenv("MODEL_BASE_URL", "").strip()
    if configured:
        return configured.rstrip("/")
    path = Path(os.getenv("GALLERY_MODEL_CONFIG") or SERVICE_ROOT.parent / "runtime-data/model.properties")
    if not path.is_file():
        return ""
    for line in path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "MODEL_BASE_URL":
            return value.strip().rstrip("/")
    return ""


def embedding_base_url() -> str:
    configured = os.getenv("EMBEDDING_BASE_URL", "").strip()
    if configured:
        return configured.rstrip("/")
    gateway = model_base_url()
    return gateway + "/embedding" if gateway else ""


def default_chroma_path() -> Path:
    """Windows 使用纯 ASCII 的本机目录，规避 HNSW 中文路径兼容问题。"""
    configured = os.getenv("CHROMA_PATH", "").strip()
    if configured:
        return Path(configured).resolve()
    local_app_data = os.getenv("LOCALAPPDATA", "").strip()
    if os.name == "nt" and local_app_data:
        return (Path(local_app_data) / "CloudGallery" / "chroma").resolve()
    return (SERVICE_ROOT / "data" / "chroma").resolve()


@dataclass(frozen=True)
class Settings:
    """服务器多模态 Embedding 与独立 Chroma 索引配置。"""

    api_key: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_API_KEY", "").strip()
    )
    base_url: str = field(
        default_factory=embedding_base_url
    )
    model_name: str = field(
        default_factory=lambda: os.getenv(
            "EMBEDDING_MODEL",
            "qwen3-vl-embedding-2b-finetuned",
        ).strip()
    )
    dimension: int = field(
        default_factory=lambda: int(os.getenv("EMBEDDING_DIMENSION", "2048"))
    )
    model_revision: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_REVISION", "checkpoint-60").strip()
    )
    api_timeout_seconds: float = field(
        default_factory=lambda: float(os.getenv("EMBEDDING_TIMEOUT_SECONDS", "600"))
    )
    chroma_path: Path = field(default_factory=default_chroma_path)
    request_limit_mb: int = field(
        default_factory=lambda: int(os.getenv("REQUEST_LIMIT_MB", "10"))
    )
    duplicate_max_scan_vectors: int = field(
        default_factory=lambda: int(os.getenv("DUPLICATE_MAX_SCAN_VECTORS", "20000"))
    )
    duplicate_scan_time_budget_seconds: float = field(
        default_factory=lambda: float(
            os.getenv("DUPLICATE_SCAN_TIME_BUDGET_SECONDS", "30")
        )
    )
    duplicate_max_neighbors: int = field(
        default_factory=lambda: int(os.getenv("DUPLICATE_MAX_NEIGHBORS", "128"))
    )

    @property
    def collection_name(self) -> str:
        signature = f"server-image-v1:{self.model_name}:{self.dimension}:{self.model_revision}"
        model_hash = hashlib.sha1(signature.encode("utf-8")).hexdigest()[:12]
        return f"gallery_{model_hash}"


settings = Settings()
