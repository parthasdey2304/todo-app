"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Inbox as InboxIcon } from "lucide-react";

export default function InboxPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksArray: Task[] = [];
        snapshot.forEach((doc) => tasksArray.push({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksArray);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const toggleTask = async (task: Task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, {
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  // Inbox logic: Show tasks with no scheduled date or no category
  const inboxTasks = tasks.filter(t => !t.scheduledDate && t.status === 'active');

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-8">
        <InboxIcon className="w-6 h-6 text-[#494bd6]" />
        Inbox
      </h1>
      <div className="space-y-3">
        {inboxTasks.length === 0 ? (
          <p className="text-[#98A6BD]">Your inbox is empty.</p>
        ) : (
          inboxTasks.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={() => {}} />)
        )}
      </div>
    </div>
  );
}
