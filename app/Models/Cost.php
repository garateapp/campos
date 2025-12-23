<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Cost extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'field_id',
        'planting_id',
        'type',
        'category',
        'description',
        'amount',
        'currency',
        'cost_date',
        'costable_type',
        'costable_id',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'cost_date' => 'date',
    ];

    /**
     * Get the field this cost is associated with.
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Get the planting this cost is associated with.
     */
    public function planting(): BelongsTo
    {
        return $this->belongsTo(Planting::class);
    }

    /**
     * Get the related entity (polymorphic).
     */
    public function costable(): MorphTo
    {
        return $this->morphTo();
    }
}
