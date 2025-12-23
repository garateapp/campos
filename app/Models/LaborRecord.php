<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaborRecord extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'user_id',
        'field_id',
        'task_id',
        'worker_name',
        'work_date',
        'hours_worked',
        'units_produced',
        'hourly_rate',
        'piece_rate',
        'total_amount',
        'notes',
    ];

    protected $casts = [
        'work_date' => 'date',
        'hours_worked' => 'decimal:2',
        'units_produced' => 'integer',
        'hourly_rate' => 'decimal:2',
        'piece_rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the user (if internal worker).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the field where work was done.
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Get the related task.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get worker name (internal or external).
     */
    public function getWorkerDisplayNameAttribute(): string
    {
        if ($this->user_id && $this->user) {
            return $this->user->name;
        }
        return $this->worker_name ?? 'Unknown Worker';
    }

    /**
     * Calculate effective hourly rate (for piece-rate validation).
     */
    public function getEffectiveHourlyRateAttribute(): ?float
    {
        if (!$this->hours_worked || $this->hours_worked == 0) {
            return null;
        }
        return $this->total_amount / $this->hours_worked;
    }
}
