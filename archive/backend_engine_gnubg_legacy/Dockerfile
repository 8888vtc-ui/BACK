FROM python:3.12-slim

# GNU Backgammon (mode terminal `gnubg -t`) — le paquet Debian embarque les
# dépendances GTK ; `--no-install-recommends` limite l'empreinte.
RUN apt-get update \
    && apt-get install -y --no-install-recommends gnubg \
    && rm -rf /var/lib/apt/lists/*

# Assure que le binaire gnubg (/usr/games/gnubg sous Debian) est dans le PATH
ENV PATH="/usr/games:${PATH}"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY tests ./tests

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]