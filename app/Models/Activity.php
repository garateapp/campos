<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'planting_id',
        'performed_by',
        'task_type_id',
        'type',
        'activity_date',
        'description',
        'metadata',
    ];

    protected $casts = [
        'activity_date' => 'date',
        'metadata' => 'array',
    ];

    /**
     * Get the planting this activity belongs to.
     */
    public function planting(): BelongsTo
    {
        return $this->belongsTo(Planting::class);
    }

    /**
     * Get the user who performed this activity.
     */
    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Get the task type used to classify this activity.
     */
    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    /**
     * Get input usages for this activity.
     */
    public function inputUsages(): HasMany
    {
        return $this->hasMany(InputUsage::class);
    }
}
