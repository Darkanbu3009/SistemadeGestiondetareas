# Task Manager Backend

API REST profesional para la gestión de tareas, desarrollada con Java 17 y Spring Boot 3.2.1.

## Características

- **Arquitectura en capas**: Controller, Service, Model
- **Gestión de tareas completa**: CRUD completo con validaciones
- **Almacenamiento en memoria**: Usando estructuras de datos Java (List)
- **Manejo robusto de errores**: Exception handlers centralizados
- **CORS habilitado**: Para integración con frontend en localhost:5173
- **Validaciones**: Bean Validation con Jakarta
- **Código limpio**: Siguiendo mejores prácticas de Spring Boot

## Tecnologías

- Java 17
- Spring Boot 3.2.1
- Maven
- Spring Web
- Spring Validation

## Modelo de Datos

```java
Task {
  id: Long           // Generado automáticamente
  title: String      // Requerido
  completed: boolean // Por defecto: false
}
```

## Endpoints REST

| Método | Endpoint           | Descripción                    | Body                    |
|--------|-------------------|--------------------------------|-------------------------|
| GET    | /api/tasks        | Listar todas las tareas        | -                       |
| POST   | /api/tasks        | Crear nueva tarea              | `{ "title": "..." }`    |
| PUT    | /api/tasks/{id}   | Toggle completar/incompletar   | -                       |
| DELETE | /api/tasks/{id}   | Eliminar tarea                 | -                       |

### Ejemplos de uso

#### Listar tareas
```bash
curl http://localhost:8080/api/tasks
```

#### Crear tarea
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Mi primera tarea"}'
```

#### Marcar como completada/incompleta
```bash
curl -X PUT http://localhost:8080/api/tasks/1
```

#### Eliminar tarea
```bash
curl -X DELETE http://localhost:8080/api/tasks/1
```

## Requisitos Previos

- Java 17 o superior
- Maven 3.6+

### Verificar instalación

```bash
java -version
mvn -version
```

## Instalación y Ejecución

### 1. Local (con Maven instalado)

```bash
# Navegar a la carpeta del backend
cd backend

# Compilar el proyecto
mvn clean install

# Ejecutar la aplicación
mvn spring-boot:run
```

La API estará disponible en: `http://localhost:8080`

### 2. GitHub Codespaces

GitHub Codespaces ya incluye Java 17 y Maven pre-instalados.

```bash
# Navegar a la carpeta del backend
cd backend

# Ejecutar directamente
mvn spring-boot:run
```

**Nota**: Codespaces automáticamente hará el port forwarding del puerto 8080.

### 3. Ejecutar JAR compilado

```bash
# Compilar
mvn clean package

# Ejecutar el JAR
java -jar target/backend-1.0.0.jar
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/taskmanager/backend/
│   │   │   ├── controller/
│   │   │   │   └── TaskController.java       # Endpoints REST
│   │   │   ├── service/
│   │   │   │   └── TaskService.java          # Lógica de negocio
│   │   │   ├── model/
│   │   │   │   ├── Task.java                 # Entidad Task
│   │   │   │   └── TaskRequest.java          # DTO para requests
│   │   │   ├── exception/
│   │   │   │   ├── TaskNotFoundException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── config/
│   │   │   │   └── WebConfig.java            # Configuración CORS
│   │   │   └── BackendApplication.java       # Clase principal
│   │   └── resources/
│   │       └── application.properties         # Configuración
│   └── test/
│       └── java/                              # Tests unitarios
├── pom.xml                                     # Dependencias Maven
└── README.md
```

## Configuración

### Puerto del servidor
Por defecto: `8080`

Para cambiar el puerto, editar `src/main/resources/application.properties`:
```properties
server.port=8080
```

### CORS
Configurado para aceptar peticiones desde: `http://localhost:5173`

Para modificar los orígenes permitidos, editar `WebConfig.java`:
```java
.allowedOrigins("http://localhost:5173", "http://otro-origen.com")
```

## Manejo de Errores

La API retorna respuestas JSON consistentes para todos los errores:

### Tarea no encontrada (404)
```json
{
  "timestamp": "2024-01-21T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found with id: 1"
}
```

### Validación fallida (400)
```json
{
  "timestamp": "2024-01-21T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "title": "Title is required"
  }
}
```

## Testing

```bash
# Ejecutar tests
mvn test

# Ejecutar tests con reporte de cobertura
mvn clean test jacoco:report
```

## Detener la Aplicación

- Si se ejecutó con `mvn spring-boot:run`: Presionar `Ctrl + C`
- Si se ejecutó el JAR directamente: Presionar `Ctrl + C`

## Próximas Mejoras

- [ ] Persistencia con base de datos (H2, PostgreSQL)
- [ ] Tests unitarios y de integración
- [ ] Documentación API con Swagger/OpenAPI
- [ ] Autenticación y autorización
- [ ] Paginación y filtrado de tareas
- [ ] Deploy en contenedor Docker

## Autor

Desarrollado como parte del sistema de gestión de tareas full-stack.

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
