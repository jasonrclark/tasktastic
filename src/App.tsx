import { useState, useEffect } from "react";
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
import { Plus, Trash, CheckCircle, Tag, CaretDown } from "@phosphor-icons/react";

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

  // Add a new todo
  const addTodo = () => {
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

  // Group todos by completion status
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-md mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">TaskTastic!</h1>
          <p className="text-muted-foreground">Keep track of your tasks with ease</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2 mb-2">
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
          </div>
          
          <div className="flex gap-2 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-foreground">Categories</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNewCategory(!showNewCategory)}
            >
              {showNewCategory ? "Cancel" : "Add Category"}
            </Button>
          </div>
          
          {showNewCategory && (
            <Card className="p-4 mb-3">
              <div className="space-y-3">
                <Input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Button 
                    onClick={addCategory} 
                    className="flex-1"
                    disabled={!newCategoryName.trim()}
                  >
                    Add Category
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="p-3 flex items-center gap-2"
                style={{ borderLeft: `3px solid ${category.color}` }}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="flex-1 truncate">{category.name}</span>
                {category.id !== "default" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCategory(category.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

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
                <div className="space-y-1">
                  {activeTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      category={getCategoryById(todo.categoryId)}
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
              <div className="space-y-1 opacity-75">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    category={getCategoryById(todo.categoryId)}
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
  category,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  category: Category;
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
      <Card 
        className="p-2 flex items-center gap-2 text-sm"
        style={{ borderLeft: `3px solid ${category.color}` }}
      >
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className={todo.completed ? "data-[state=checked]:bg-accent data-[state=checked]:border-accent" : ""}
        />
        <div className="flex-1">
          <label
            htmlFor={`todo-${todo.id}`}
            className={`cursor-pointer flex-1 block ${
              todo.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {todo.text}
          </label>
          <div className="flex items-center mt-0.5">
            <span
              className="text-xs px-1.5 py-0 rounded-full text-[10px]"
              style={{ 
                backgroundColor: `${category.color}20`, 
                color: category.color,
                border: `1px solid ${category.color}40`
              }}
            >
              {category.name}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
        >
          <Trash size={14} />
        </Button>
      </Card>
    </motion.div>
  );
}

export default App;