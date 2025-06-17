import { useState, useEffect, useCallback } from "react";
import { useKV } from "@github/spark/hooks";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { Todo, Category } from "./types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash, CheckCircle, Tag, CaretDown, Keyboard } from "@phosphor-icons/react";

function App() {
  // Use KV store for persisting todos and categories
  const [todos, setTodos] = useKV<Todo[]>("todos", []);
  const [categories, setCategories] = useKV<Category[]>("categories", [
    { id: "default", name: "General", color: "#808080" },
    { id: "work", name: "Work", color: "#e53935" },
    { id: "personal", name: "Personal", color: "#43a047" },
    { id: "shopping", name: "Shopping", color: "#1e88e5" },
    { id: "health", name: "Health", color: "#8e24aa" }
  ]);
  
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("default");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [focusedTodoId, setFocusedTodoId] = useState<string | null>(null);

  // Add a new todo
  const addTodo = useCallback(() => {
    if (newTodo.trim() === "") return;

    const todo: Todo = {
      id: uuidv4(),
      text: newTodo,
      completed: false,
      createdAt: Date.now(),
      categoryId: selectedCategory
    };

    setTodos([...todos, todo]);
    setNewTodo("");
    toast.success("Task added");
  }, [newTodo, selectedCategory, todos, setTodos]);

  // Toggle todo completion
  const toggleTodo = useCallback((id: string) => {
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
  }, [todos, setTodos]);

  // Delete a todo
  const deleteTodo = useCallback((id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    toast.error("Task deleted");
  }, [todos, setTodos]);

  // Add a new category
  const addCategory = () => {
    if (newCategoryName.trim() === "") return;
    
    const newCategory: Category = {
      id: uuidv4(),
      name: newCategoryName,
      color: newCategoryColor
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName("");
    setNewCategoryColor("#6366f1");
    setShowNewCategory(false);
    toast.success("Category added");
  };

  // Delete a category
  const deleteCategory = (id: string) => {
    // Don't allow deleting the default category
    if (id === "default") return;
    
    // Update all todos that used this category to use the default category
    const updatedTodos = todos.map(todo => 
      todo.categoryId === id ? { ...todo, categoryId: "default" } : todo
    );
    
    setTodos(updatedTodos);
    setCategories(categories.filter(category => category.id !== id));
    toast.error("Category deleted");
  };

  // Get category by ID
  const getCategoryById = (id?: string) => {
    return categories.find(category => category.id === id) || categories[0];
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo();
  };

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (
      document.activeElement?.tagName === "INPUT" || 
      document.activeElement?.tagName === "TEXTAREA"
    ) {
      // Special case for Enter in the new todo input
      if (e.key === "Enter" && document.activeElement.id === "new-todo-input") {
        e.preventDefault();
        addTodo();
      }
      return;
    }

    switch (e.key) {
      case "n": // Add new task
        e.preventDefault();
        document.getElementById("new-todo-input")?.focus();
        break;
      case "c": // Toggle category panel
        e.preventDefault();
        setShowNewCategory(prev => !prev);
        break;
      case "?": // Show/hide shortcuts help
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        break;
      case "j": // Move focus down
        e.preventDefault();
        if (!focusedTodoId && activeTodos.length > 0) {
          setFocusedTodoId(activeTodos[0].id);
        } else if (focusedTodoId) {
          const currentIndex = activeTodos.findIndex(todo => todo.id === focusedTodoId);
          if (currentIndex < activeTodos.length - 1) {
            setFocusedTodoId(activeTodos[currentIndex + 1].id);
          }
        }
        break;
      case "k": // Move focus up
        e.preventDefault();
        if (!focusedTodoId && activeTodos.length > 0) {
          setFocusedTodoId(activeTodos[activeTodos.length - 1].id);
        } else if (focusedTodoId) {
          const currentIndex = activeTodos.findIndex(todo => todo.id === focusedTodoId);
          if (currentIndex > 0) {
            setFocusedTodoId(activeTodos[currentIndex - 1].id);
          }
        }
        break;
      case "x": // Toggle completion of focused task
        if (focusedTodoId) {
          e.preventDefault();
          toggleTodo(focusedTodoId);
        }
        break;
      case "d": // Delete focused task
        if (focusedTodoId) {
          e.preventDefault();
          deleteTodo(focusedTodoId);
          setFocusedTodoId(null);
        }
        break;
      case "Escape": // Clear focus
        if (focusedTodoId) {
          e.preventDefault();
          setFocusedTodoId(null);
        } else if (showShortcutsHelp) {
          e.preventDefault();
          setShowShortcutsHelp(false);
        }
        break;
    }
  }, [addTodo, activeTodos, focusedTodoId, toggleTodo, deleteTodo, showShortcutsHelp]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Group todos by completion status
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-md mx-auto">
        <header className="mb-5 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">TaskTastic!</h1>
          <p className="text-muted-foreground text-sm">Keep track of your tasks with ease</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 h-7 text-xs flex items-center gap-1"
            onClick={() => setShowShortcutsHelp(true)}
          >
            <Keyboard size={14} />
            <span>Shortcuts</span>
          </Button>
        </header>

        {showShortcutsHelp && (
          <Card className="mb-4 p-3 bg-muted/80 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => setShowShortcutsHelp(false)}
              >
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add new task:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">n</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle category panel:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">c</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Move down:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">j</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Move up:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">k</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle task:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">x</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delete task:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">d</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clear selection:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Show shortcuts:</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">?</kbd>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 h-8 text-sm"
              id="new-todo-input"
            />
            <Button type="submit" size="icon" className="h-8 w-8">
              <Plus weight="bold" size={16} />
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full h-8 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        
        {/* Category Management */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-medium text-foreground">Categories</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="h-7 text-xs"
            >
              {showNewCategory ? "Cancel" : "Add Category"}
            </Button>
          </div>
          
          {showNewCategory && (
            <Card className="p-3 mb-2">
              <div className="space-y-2">
                <Input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Button 
                    onClick={addCategory} 
                    className="flex-1 h-8 text-xs"
                    disabled={!newCategoryName.trim()}
                  >
                    Add Category
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          <div className="grid grid-cols-2 gap-1.5">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="py-1 px-2 flex items-center gap-2"
                style={{ borderLeft: `3px solid ${category.color}` }}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="flex-1 truncate text-sm">{category.name}</span>
                {category.id !== "default" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCategory(category.id)}
                    className="h-5 w-5 text-muted-foreground hover:text-destructive p-0"
                  >
                    <Trash size={12} />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Active Todos */}
          <div>
            <h2 className="text-base font-medium text-foreground mb-2">
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
                <div className="space-y-0.5">
                  {activeTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      category={getCategoryById(todo.categoryId)}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      isFocused={focusedTodoId === todo.id}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-base font-medium text-foreground mb-2">
                Completed ({completedTodos.length})
              </h2>
              <div className="space-y-0.5 opacity-75">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    category={getCategoryById(todo.categoryId)}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    isFocused={focusedTodoId === todo.id}
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
  category,
  onToggle,
  onDelete,
  isFocused = false
}: {
  todo: Todo;
  category: Category;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isFocused?: boolean;
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
      <Card 
        className={`py-1 px-2 flex items-center gap-2 text-sm ${isFocused ? "ring-1 ring-accent" : ""}`}
        style={{ borderLeft: `3px solid ${category.color}` }}
      >
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className={`h-3.5 w-3.5 ${todo.completed ? "data-[state=checked]:bg-accent data-[state=checked]:border-accent" : ""}`}
        />
        <div className="flex flex-1 items-center min-w-0">
          <label
            htmlFor={`todo-${todo.id}`}
            className={`cursor-pointer flex-1 truncate ${
              todo.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {todo.text}
          </label>
          <span
            className="text-[9px] px-1 ml-1 rounded-full shrink-0"
            style={{ 
              backgroundColor: `${category.color}20`, 
              color: category.color,
              border: `1px solid ${category.color}40`
            }}
          >
            {category.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          className="h-5 w-5 text-muted-foreground hover:text-destructive p-0"
        >
          <Trash size={12} />
        </Button>
      </Card>
    </motion.div>
  );
}

export default App;