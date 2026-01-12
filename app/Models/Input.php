<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Input extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'field_id',
        'input_category_id',
        'name',
        'unit',
        'current_stock',
        'min_stock_alert',
        'unit_cost',
        'invoice_date',
        'return_period_days',
        'return_min_quantity',
        'expiration_date',
        'notes',
    ];

    protected $casts = [
        'field_id' => 'integer',
        'input_category_id' => 'integer',
        'current_stock' => 'decimal:2',
        'min_stock_alert' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'invoice_date' => 'date',
        'return_period_days' => 'integer',
        'return_min_quantity' => 'decimal:2',
        'expiration_date' => 'date',
    ];

    /**
     * Get the field this input belongs to (if any).
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Get the category of this input.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(InputCategory::class, 'input_category_id');
    }

    /**
     * Alias para compatibilidad (inputCategory).
     */
    public function inputCategory(): BelongsTo
    {
        return $this->belongsTo(InputCategory::class, 'input_category_id');
    }

    /**
     * Get usages of this input.
     */
    public function usages(): HasMany
    {
        return $this->hasMany(InputUsage::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(InputLot::class);
    }

    /**
     * Check if stock is below minimum.
     */
    public function isLowStock(): bool
    {
        if (!$this->min_stock_alert) {
            return false;
        }
        return $this->current_stock <= $this->min_stock_alert;
    }
}
