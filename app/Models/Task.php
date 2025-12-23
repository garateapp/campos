<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'field_id',
        'planting_id',
        'created_by',
        'title',
        'description',
        'task_type_id',
        'priority',
        'status',
        'due_date',
        'completed_date',
        'metadata',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_date' => 'date',
        'task_type_id' => 'integer',
        'metadata' => 'array',
    ];

    /**
     * Get the type of this task.
     */
    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    /**
     * Get the field this task is for.
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Get the planting this task relates to.
     */
    public function planting(): BelongsTo
    {
        return $this->belongsTo(Planting::class);
    }

    /**
     * Get the user who created this task.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get task assignments.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /**
     * Get task logs.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(TaskLog::class);
    }

    /**
     * Get assigned users through assignments.
     */
    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'task_assignments')
            ->withPivot(['status', 'started_at', 'completed_at'])
            ->withTimestamps();
    }

    /**
     * Check if task is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status !== 'completed' && 
               $this->status !== 'cancelled' && 
               $this->due_date < now()->startOfDay();
    }

    /**
     * Mark task as completed.
     */
    public function markCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_date' => now(),
        ]);
    }
}
