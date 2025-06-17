import { useState, useEffect } from "react";
import { useKV } from "@github/spark/hooks";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { Todo } from "./types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash, CheckCircle } from "@phosphor-icons/react";

function App() {
  // Use KV store for persisting todos
  const [todos, setTodos] = useKV<Todo[]>("todos", []);
  const [newTodo, setNewTodo] = useState("");

  // Add a new todo
  const addTodo = () => {
    if (newTodo.trim() === "") return;

    const todo: Todo = {
      id: uuidv4(),
      text: newTodo,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos([...todos, todo]);
    setNewTodo("");
    toast.success("Task added");
  };

  // Toggle todo completion
  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    
    const todo = todos.find(todo => todo.id === id);
    if (todo && !todo.completed) {
      toast("Task completed!", {
        icon: <CheckCircle weight="fill" className="text-green-500" />
      });
    }
  };

  // Delete a todo
  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    toast.error("Task deleted");
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo();
  };

  // Group todos by completion status
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-md mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Task Master</h1>
          <p className="text-muted-foreground">Keep track of your tasks with ease</p>
        </header>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1"
            id="new-todo-input"
          />
          <Button type="submit" size="icon">
            <Plus weight="bold" />
          </Button>
        </form>

        <div className="space-y-6">
          {/* Active Todos */}
          <div>
            <h2 className="text-lg font-medium text-foreground mb-3">
              Tasks ({activeTodos.length})
            </h2>
            
            <AnimatePresence>
              {activeTodos.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6 text-muted-foreground"
                >
                  No active tasks. Add one above!
                </motion.p>
              ) : (
                <div className="space-y-2">
                  {activeTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-foreground mb-3">
                Completed ({completedTodos.length})
              </h2>
              <div className="space-y-2 opacity-75">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Todo Item Component
function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ 
        duration: 0.2,
        ease: "easeInOut"
      }}
    >
      <Card className="p-4 flex items-center gap-3">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className={todo.completed ? "data-[state=checked]:bg-accent data-[state=checked]:border-accent" : ""}
        />
        <label
          htmlFor={`todo-${todo.id}`}
          className={`flex-1 cursor-pointer ${
            todo.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.text}
        </label>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash size={16} />
        </Button>
      </Card>
    </motion.div>
  );
}

export default App;