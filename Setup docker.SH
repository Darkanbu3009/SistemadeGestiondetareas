#!/bin/bash

# ================================
# Script de configuración Docker
# Task Manager
# ================================

echo "🐳 Configurando Docker para Task Manager..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en la raíz del proyecto
if [ ! -d "backend" ] || [ ! -d "task-manager" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    echo "   Debes tener las carpetas 'backend' y 'task-manager'"
    exit 1
fi

# 1. Copiar Dockerfile del backend
echo -e "${BLUE}📦 Configurando Backend...${NC}"
cat > backend/Dockerfile << 'EOF'
# ================================
# STAGE 1: Build
# ================================
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# ================================
# STAGE 2: Run
# ================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /app/target/*.jar app.jar

USER spring:spring

EXPOSE 8080

ENV JAVA_OPTS="-Xmx512m -Xms256m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
EOF

cat > backend/.dockerignore << 'EOF'
target/
.idea/
*.iml
.vscode/
*.log
.git/
.mvn/
mvnw
mvnw.cmd
README.md
EOF

# Actualizar application.properties
cat > backend/src/main/resources/application.properties << 'EOF'
server.port=8080

spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/taskmanager}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:taskuser}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:taskpass}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
spring.jpa.show-sql=${SPRING_JPA_SHOW_SQL:true}
spring.jpa.properties.hibernate.format_sql=true

logging.level.org.hibernate.SQL=DEBUG
logging.level.com.taskmanager=INFO
EOF

echo -e "${GREEN}✓ Backend configurado${NC}"

# 2. Copiar archivos del frontend
echo -e "${BLUE}🎨 Configurando Frontend...${NC}"

cat > task-manager/Dockerfile << 'EOF'
# ================================
# STAGE 1: Build
# ================================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api/tasks
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ================================
# STAGE 2: Serve with Nginx
# ================================
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

cat > task-manager/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

cat > task-manager/.dockerignore << 'EOF'
node_modules/
dist/
.idea/
.vscode/
*.log
.git/
coverage/
.env.local
.env.*.local
README.md
EOF

echo -e "${GREEN}✓ Frontend configurado${NC}"

# 3. Crear docker-compose.yml
echo -e "${BLUE}🐙 Creando docker-compose.yml...${NC}"

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: taskmanager-db
    environment:
      POSTGRES_DB: taskmanager
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: taskpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - taskmanager-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskuser -d taskmanager"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskmanager-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/taskmanager
      SPRING_DATASOURCE_USERNAME: taskuser
      SPRING_DATASOURCE_PASSWORD: taskpass
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
      SPRING_JPA_SHOW_SQL: "true"
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - taskmanager-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/api/tasks"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    build:
      context: ./task-manager
      dockerfile: Dockerfile
      args:
        VITE_API_URL: /api/tasks
    container_name: taskmanager-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - taskmanager-network
    restart: unless-stopped

networks:
  taskmanager-network:
    driver: bridge

volumes:
  postgres_data:
EOF

echo -e "${GREEN}✓ docker-compose.yml creado${NC}"

# 4. Actualizar App.tsx
echo -e "${BLUE}📝 Actualizando App.tsx...${NC}"

cat > task-manager/src/App.tsx << 'EOF'
import { useState, useEffect } from 'react';
import type { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "/api/tasks";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        setTasks(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddTask = async (title: string) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        setError(`Error al crear tarea: ${res.status}`);
        return;
      }
      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
      setError(null);
    } catch (err) {
      setError("Error de conexión al crear tarea");
    }
  };

  const handleToggleComplete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setError(`Error al actualizar tarea: ${res.status}`);
        return;
      }
      const updatedTask = await res.json();
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      setError(null);
    } catch (err) {
      setError("Error de conexión al actualizar tarea");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setError(`Error al eliminar tarea: ${res.status}`);
        return;
      }
      setTasks(prev => prev.filter(task => task.id !== id));
      setError(null);
    } catch (err) {
      setError("Error de conexión al eliminar tarea");
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Cargando tareas...</p>;
  }

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>Task Manager</h1>
          <p className="subtitle">Gestiona tus tareas de forma simple y efectiva</p>
          <div className="stats">
            <span>{completedCount} de {totalCount} completadas</span>
          </div>
        </header>
        <main className="app-main">
          {error && (
            <div style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#dc2626",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem"
            }}>
              ⚠️ {error}
            </div>
          )}
          <TaskForm onAddTask={handleAddTask} />
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
EOF

echo -e "${GREEN}✓ App.tsx actualizado${NC}"

echo ""
echo -e "${GREEN}✅ ¡Configuración completada!${NC}"
echo ""
echo "Ahora puedes ejecutar:"
echo ""
echo "  docker-compose build    # Construir imágenes"
echo "  docker-compose up -d    # Iniciar servicios"
echo ""
echo "La aplicación estará disponible en:"
echo "  - Frontend: http://localhost"
echo "  - API:      http://localhost:8080/api/tasks"
echo ""