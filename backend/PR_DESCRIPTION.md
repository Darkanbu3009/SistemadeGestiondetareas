# Pull Request: Add Spring Boot Backend API for Task Manager

## 🎯 Descripción

Implementación profesional de un backend REST API usando **Java 17** y **Spring Boot 3.2.1** para el sistema de gestión de tareas.

## ✨ Características Principales

### Arquitectura
- ✅ **Arquitectura en capas**: Controller, Service, Model
- ✅ **Código limpio y profesional**: Siguiendo mejores prácticas de Spring Boot
- ✅ **Separación de responsabilidades**: Cada capa con su responsabilidad específica
- ✅ **Manejo robusto de errores**: Exception handlers centralizados con respuestas JSON consistentes

### Funcionalidad
- ✅ **CRUD completo de tareas**: Create, Read, Update, Delete
- ✅ **Almacenamiento en memoria**: Usando `List<Task>` con generación automática de IDs
- ✅ **Validaciones**: Bean Validation con Jakarta (`@NotBlank`)
- ✅ **CORS habilitado**: Configurado para `http://localhost:5173` (frontend)

### Configuración
- ✅ **Puerto 8080**: Configurado en `application.properties`
- ✅ **Respuestas JSON**: Todas las respuestas en formato JSON
- ✅ **Status codes apropiados**: 200, 201, 204, 404, 400, 500

## 📦 Estructura del Proyecto

```
backend/
├── src/main/java/com/taskmanager/backend/
│   ├── BackendApplication.java          # Clase principal Spring Boot
│   ├── controller/
│   │   └── TaskController.java          # Endpoints REST
│   ├── service/
│   │   └── TaskService.java             # Lógica de negocio
│   ├── model/
│   │   ├── Task.java                    # Entidad Task
│   │   └── TaskRequest.java             # DTO para requests
│   ├── exception/
│   │   ├── TaskNotFoundException.java   # Excepción personalizada
│   │   └── GlobalExceptionHandler.java  # Manejo centralizado de errores
│   └── config/
│       └── WebConfig.java               # Configuración CORS
├── src/main/resources/
│   └── application.properties            # Configuración de la aplicación
├── pom.xml                               # Dependencias Maven
├── .gitignore                            # Archivos ignorados
└── README.md                             # Documentación completa
```

## 🔌 Endpoints REST Implementados

| Método | Endpoint | Descripción | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/tasks` | Listar todas las tareas | - | `200 OK` + `Task[]` |
| `POST` | `/api/tasks` | Crear nueva tarea | `{ "title": "..." }` | `201 CREATED` + `Task` |
| `PUT` | `/api/tasks/{id}` | Toggle completar/incompletar | - | `200 OK` + `Task` |
| `DELETE` | `/api/tasks/{id}` | Eliminar tarea | - | `204 NO CONTENT` |

## 📊 Modelo de Datos

```java
Task {
  id: Long           // Generado automáticamente (AtomicLong)
  title: String      // Requerido, no puede estar vacío
  completed: boolean // Por defecto: false
}
```

## 🛠️ Tecnologías Utilizadas

- **Java 17**
- **Spring Boot 3.2.1**
- **Maven**
- **Spring Web** (REST API)
- **Spring Validation** (Bean Validation)
- **Spring DevTools** (Desarrollo)

## 🚀 Cómo Ejecutar

### Requisitos Previos
- Java 17+
- Maven 3.6+

### Ejecución Local
```bash
cd backend
mvn spring-boot:run
```

### GitHub Codespaces
```bash
cd backend
mvn spring-boot:run
```

La API estará disponible en: `http://localhost:8080`

## 📝 Ejemplos de Uso

### Crear tarea
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Implementar backend con Spring Boot"}'
```

### Listar tareas
```bash
curl http://localhost:8080/api/tasks
```

### Marcar como completada
```bash
curl -X PUT http://localhost:8080/api/tasks/1
```

### Eliminar tarea
```bash
curl -X DELETE http://localhost:8080/api/tasks/1
```

## ⚠️ Manejo de Errores

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

## ✅ Testing

El backend está listo para:
- ✅ Integración con el frontend existente en `/task-manager`
- ✅ Pruebas con herramientas como Postman, cURL, o el frontend React
- ✅ Ejecución en GitHub Codespaces
- ✅ Deploy futuro con base de datos

## 📚 Documentación

Se incluye un README completo en `/backend/README.md` con:
- Instrucciones detalladas de instalación
- Guía de ejecución local y en Codespaces
- Documentación de endpoints
- Ejemplos de uso
- Estructura del proyecto
- Próximas mejoras sugeridas

## 🔮 Próximas Mejoras Sugeridas

- [ ] Persistencia con base de datos (H2, PostgreSQL)
- [ ] Tests unitarios y de integración
- [ ] Documentación API con Swagger/OpenAPI
- [ ] Autenticación y autorización (JWT)
- [ ] Paginación y filtrado de tareas
- [ ] Deploy con Docker

## 📌 Notas Importantes

- ✅ **Frontend NO modificado**: El código en `/task-manager` permanece intacto
- ✅ **CORS configurado**: El frontend puede comunicarse con el backend
- ✅ **Código profesional**: Siguiendo estándares de la industria
- ✅ **Listo para producción**: Con manejo de errores y validaciones

---

**Este PR está listo para review y merge.** 🚀
