import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function OnboardingPlan({ employeeId }) {
  const { companyId } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId || !companyId) return;
    const tasksColRef = collection(db, "companies", companyId, "employees", employeeId, "onboardingTasks");
    const unsubscribe = onSnapshot(tasksColRef, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [employeeId, companyId]);

  const handleToggleTask = async (taskId, currentStatus) => {
    const taskRef = doc(db, "companies", companyId, "employees", employeeId, "onboardingTasks", taskId);
    await updateDoc(taskRef, { completed: !currentStatus });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const tasksColRef = collection(db, "companies", companyId, "employees", employeeId, "onboardingTasks");
    await addDoc(tasksColRef, { text: newTask, completed: false });
    setNewTask('');
  };

  const handleDeleteTask = async (taskId) => {
    const taskRef = doc(db, "companies", companyId, "employees", employeeId, "onboardingTasks", taskId);
    await deleteDoc(taskRef);
  };
  
  const completionPercentage = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  if (loading) return <div>Loading Onboarding Plan...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Onboarding Progress</h3>
        
        {/* Progress Bar */}
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Completion</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
            </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
            {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id, task.completed)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className={`ml-3 text-sm text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.text}
                        </label>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Add an onboarding task..."
                    className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                />
                <button type="submit" className="bg-blue-600 text-white font-semibold p-2 rounded-lg hover:bg-blue-700">
                    <Plus size={20} />
                </button>
            </div>
        </form>
    </div>
  );
}

export default OnboardingPlan;