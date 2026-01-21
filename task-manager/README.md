# Task Manager - PASO 1

Sistema de gestión de tareas desarrollado con React, TypeScript y Vite.

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **CSS** - Estilos personalizados sin frameworks

## 📋 Características

- ✅ Crear nuevas tareas
- ✅ Marcar tareas como completadas
- ✅ Eliminar tareas
- ✅ Visualizar estadísticas de progreso
- ✅ Estado local con datos mockeados
- ✅ Interfaz responsive

## 📁 Estructura del Proyecto

```
task-manager/
├── src/
│   ├── components/
│   │   ├── TaskForm.tsx      # Formulario para crear tareas
│   │   ├── TaskItem.tsx      # Componente individual de tarea
│   │   └── TaskList.tsx      # Lista de tareas
│   ├── types/
│   │   └── Task.ts           # Definición del tipo Task
│   ├── App.tsx               # Componente principal
│   ├── App.css               # Estilos del componente principal
│   ├── main.tsx              # Punto de entrada
│   └── index.css             # Estilos globales
├── package.json
└── vite.config.ts
```

## 🏗️ Arquitectura y Estado

### Gestión del Estado

El estado se maneja en el componente `App.tsx` utilizando el hook `useState` de React:

```typescript
const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
```

### Flujo de Datos

1. **Estado Centralizado**: Todas las tareas se almacenan en el componente `App`
2. **Props Down**: Los datos fluyen hacia abajo a través de props
3. **Events Up**: Los eventos (crear, completar, eliminar) fluyen hacia arriba mediante callbacks

### Operaciones CRUD

- **Create**: `handleAddTask` - Agrega una nueva tarea al array de estado
- **Read**: Las tareas se leen directamente del estado y se pasan como props
- **Update**: `handleToggleComplete` - Modifica el estado `completed` de una tarea
- **Delete**: `handleDeleteTask` - Filtra y elimina una tarea del estado

### Modelo de Datos

```typescript
interface Task {
  id: number;        // Identificador único
  title: string;     // Título de la tarea
  completed: boolean; // Estado de completado
}
```

## 🛠️ Instrucciones de Instalación y Ejecución

### Requisitos Previos

- Node.js >= 16.0.0
- npm >= 8.0.0

### Instalación

```bash
# Instalar dependencias
npm install
```

### Ejecución en Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`

### Build para Producción

```bash
# Crear build optimizado
npm run build
```

Los archivos se generarán en la carpeta `dist/`

### Preview del Build

```bash
# Previsualizar el build de producción
npm run preview
```

## 🎨 Características de Implementación

### Componentes Pequeños y Reutilizables

- **TaskForm**: Maneja el input y la creación de tareas
- **TaskItem**: Representa una tarea individual con sus acciones
- **TaskList**: Renderiza la lista completa de tareas

### Props Bien Tipadas

Todos los componentes utilizan interfaces TypeScript para definir sus props:

```typescript
interface TaskFormProps {
  onAddTask: (title: string) => void;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
}
```

### Separación de Responsabilidades

- **Tipos**: Definidos en carpeta separada `types/`
- **Componentes**: Cada uno tiene una responsabilidad única
- **Estilos**: CSS organizado por secciones

## 📝 Datos Iniciales

El proyecto incluye datos mockeados para pruebas:

```typescript
const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Aprender React', completed: false },
  { id: 2, title: 'Configurar TypeScript', completed: true },
  { id: 3, title: 'Crear componentes reutilizables', completed: false },
];
```

## 🎯 Buenas Prácticas Implementadas

- ✅ Componentes funcionales con hooks
- ✅ TypeScript strict mode
- ✅ Inmutabilidad en las actualizaciones de estado
- ✅ Keys únicas en listas
- ✅ Validación de entrada de usuario
- ✅ Código limpio y legible
- ✅ Nomenclatura descriptiva
- ✅ Separación de lógica y presentación

## 🔜 Próximos Pasos (PASO 2)

En futuras iteraciones se podría agregar:

- Persistencia con localStorage
- Edición de tareas existentes
- Filtros (todas, completadas, pendientes)
- Integración con backend/API
- Tests unitarios y de integración

## 👨‍💻 Desarrollo

Este proyecto fue desarrollado siguiendo las mejores prácticas de una fábrica de software, con código limpio, tipado fuerte y arquitectura escalable.
