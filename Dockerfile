FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN python3 -m venv /opt/skillsphere
ENV PATH="/opt/skillsphere/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt requirements-deploy.txt ./
RUN pip install --no-cache-dir -r requirements-deploy.txt

COPY app.py analyse.mjs ./
COPY site/ ./site/
EXPOSE 10000
CMD ["sh", "-c", "exec gunicorn --no-control-socket --preload --workers 1 --threads 2 --timeout 90 --bind 0.0.0.0:${PORT:-10000} 'app:create_app()'"]
