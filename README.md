# SistemadeGestiondetareas
Sistema de pruebas

Sincronizar los documentos de git codespaces y github web en caso de modificaciones
git status
git add .
git commit -m "Describe tus cambios"
git push origin main
git status

Traerte actualizaciones de Github web a Github code spaces
git pull origin main

Cierra Front end y back end
Control C

Reinicia back end
cd backend
mvn spring-boot:run

Reinicia front end
cd task-manager
npm install
npm run dev

Verifica que PostgreSQL esté corriendo:
docker compose up -d

Prueba el endpoint:
curl https://ominous-space-halibut-55g4p49jrvgc4x4r-8080.app.github.dev/api/tasks

El proyecto está completamente dockerizado.
Iniciar todo docker-compose up -d
Detener todo docker-compose down
Reiniciar todo docker-compose restart
Ver logs docker-compose logs -f
Ver estado docker-compose ps

docker-compose down
docker-compose build --no-cache
docker-compose up -d




