"use client";

import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";

export default function NewTaskPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Create Task</h1>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <TaskForm
          submitLabel="Create Task"
          onSubmit={async (data) => {
            const res = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                dueDate: data.dueDate || null,
              }),
            });
            if (!res.ok) throw new Error("Failed to create task");
            router.push("/");
          }}
        />
      </div>
    </div>
  );
}
