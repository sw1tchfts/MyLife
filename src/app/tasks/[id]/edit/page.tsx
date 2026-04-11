"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import SubtaskList from "@/components/SubtaskList";
import type { Status, Priority } from "@/generated/prisma/client";
import type { SubtaskData } from "@/components/TaskCard";

interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  subtasks?: SubtaskData[];
}

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchTask = useCallback(() => {
    fetch(`/api/tasks/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setTask(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  if (loading) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading task...
      </p>
    );
  }

  if (notFound || !task) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Task Not Found
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          The task you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const initialData = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Edit Task
      </h1>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <TaskForm
          initialData={initialData}
          submitLabel="Save Changes"
          onSubmit={async (data) => {
            const res = await fetch(`/api/tasks/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                dueDate: data.dueDate || null,
              }),
            });
            if (!res.ok) throw new Error("Failed to update task");
            router.push("/");
          }}
        />
      </div>

      {/* Subtasks */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <SubtaskList
          taskId={id}
          subtasks={task.subtasks || []}
          onUpdate={fetchTask}
        />
      </div>
    </div>
  );
}
