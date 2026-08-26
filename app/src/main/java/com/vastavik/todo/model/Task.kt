package com.vastavik.todo.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Attachment(
    val id: String = "",
    val fileName: String = "",
    val contentType: String = "",
    val sizeBytes: Long = 0,
    val storagePath: String = "",
    val downloadUrl: String = "",
    val thumbnailUrl: String? = null,
    val createdAt: String = ""
)

data class Task(
    @DocumentId val id: String = "",
    val userId: String = "",
    val title: String = "",
    val description: String? = null,
    val status: String = "active", // active, completed, archived
    val scheduledDate: String? = null, // YYYY-MM-DD
    val dueAt: String? = null, // ISO string
    val reminderAt: String? = null, // ISO string
    val recurrence: String? = "none", // none, daily, weekdays, weekly, monthly, custom
    val categoryId: String? = null,
    val categoryName: String? = null,
    val labels: List<String> = emptyList(),
    val priority: String = "none", // none, low, medium, high, urgent
    val attachments: List<Attachment> = emptyList(),
    val order: Long = 0,
    @ServerTimestamp val createdAt: Date? = null,
    @ServerTimestamp val updatedAt: Date? = null,
    @ServerTimestamp val completedAt: Date? = null,
    @ServerTimestamp val archivedAt: Date? = null
)
