FROM python:3.13-slim AS builder

# ── System dependencies ──────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    build-essential \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Build whisper.cpp ────────────────────────────────────────────────
ARG WHISPER_VERSION=v1.7.5
RUN git clone --depth 1 --branch ${WHISPER_VERSION} \
        https://github.com/ggerganov/whisper.cpp.git /tmp/whisper \
    && cmake -S /tmp/whisper -B /tmp/whisper/build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build /tmp/whisper/build --config Release -j$(nproc) \
    && cmake --install /tmp/whisper/build \
    && ldconfig \
    && rm -rf /tmp/whisper

# ── Download whisper model (small) ───────────────────────────────────
RUN mkdir -p /app/models/whisper \
    && curl -L -o /app/models/whisper/ggml-small.bin \
       "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"

# ── Poetry & Python deps ────────────────────────────────────────────
ENV POETRY_VERSION=1.8.3
ENV POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

WORKDIR /app

# Copy dependency files first (Docker cache optimization)
COPY pyproject.toml poetry.lock* /app/

# Install Python dependencies (no venv, no root package yet)
RUN poetry install --no-root

# ── Copy project source code ────────────────────────────────────────
COPY flows /app/flows
COPY tools /app/tools
COPY Makefile /app/Makefile

# Install the root package so "flows" is importable
RUN poetry install --only-root

# ── Default command: run full Shorts pipeline ────────────────────────
CMD ["python", "-m", "flows.image_content_generator.pipeline.main", "short", "all"]
