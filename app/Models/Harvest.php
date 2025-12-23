<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Harvest extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'planting_id',
        'harvest_date',
        'quantity_kg',
        'quality_grade',
        'price_per_kg',
        'notes',
    ];

    protected $casts = [
        'harvest_date' => 'date',
        'quantity_kg' => 'decimal:2',
        'price_per_kg' => 'decimal:2',
    ];

    /**
     * Get the planting this harvest belongs to.
     */
    public function planting(): BelongsTo
    {
        return $this->belongsTo(Planting::class);
    }

    /**
     * Calculate total revenue for this harvest.
     */
    public function getTotalRevenueAttribute(): float
    {
        return $this->quantity_kg * ($this->price_per_kg ?? 0);
    }
}
