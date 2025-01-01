#Dockerfile
# Użycie oficjalnego obrazu Node.js
FROM node:20

# Ustawienie katalogu roboczego w kontenerze
WORKDIR /usr/src/app

# Kopiowanie plików aplikacji
COPY app/ ./
COPY prod.env .env

# Instalowanie zależności
RUN npm install

# Ustawienie zmiennej środowiskowej (opcjonalnie)
ENV NODE_ENV=production

# Ekspozycja portu (jeśli aplikacja tego wymaga)
EXPOSE 8880

# Uruchomienie aplikacji
CMD ["npm", "start"]
