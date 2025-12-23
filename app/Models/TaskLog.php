<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'action',
        'note',
        'data',
        'client_uuid',
        'logged_at',
    ];

    protected $casts = [
        'data' => 'array',
        'logged_at' => 'datetime',
    ];

    /**
     * Get the task.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who logged this.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this log was already synced (by UUID).
     */
    public static function wasAlreadySynced(string $uuid): bool
    {
        return static::where('client_uuid', $uuid)->exists();
    }
}
